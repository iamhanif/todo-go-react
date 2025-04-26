import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GoCheckCircleFill } from "react-icons/go";
import { TbTrashXFilled } from "react-icons/tb";
import { BASE_URL } from "../App";
import "./TodoList.css";

type Todo = {
  _id: number;
  body: string;
  completed: boolean;
};

const TodoList: React.FC = () => {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState<string>("");

  const { data: todos } = useQuery<Todo[]>({
    queryKey: ["todos"],

    queryFn: async () => {
      try {
        const res = await fetch(`${BASE_URL}/todos`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something wrong in data fetching");
        }
        return data || [];
      } catch (error) {
        console.log(error);
      }
    },
  });

  const { mutate: updateTodo, isPending: isUpdating } = useMutation({
    mutationKey: ["updateTodo"],
    mutationFn: async (todo: Todo) => {
      try {
        if (todo.completed) return alert("Already done");
        const res = await fetch(`${BASE_URL}/todos/${todo._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ completed: true }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something wrong in updating");
        }
        return data || [];
      } catch (error) {
        console.log(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const { mutate: deleteTodo, isPending: isDeleting } = useMutation({
    mutationKey: ["deleteTodo"],
    mutationFn: async (id: number) => {
      try {
        const res = await fetch(`${BASE_URL}/todos/${id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something wrong in deleting");
        }
        return data || [];
      } catch (error) {
        console.log(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const { mutate: createTodo, isPending: isCreating } = useMutation({
    mutationKey: ["createTodo"],
    mutationFn: async (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault();
      try {
        const res = await fetch(`${BASE_URL}/todos`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ body: newTodo }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "something went wrong");
        }
        setNewTodo("");
        return data;
      } catch (error) {
        console.log(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  console.log(todos, "todos");

  return (
    <div className="todo-container">
      <div className="input-container">
        <input
          type="text"
          value={newTodo}
          placeholder="Add a new todo..."
          onChange={(e) => setNewTodo(e.target.value)}
        />
        {!isCreating ? <button onClick={createTodo}>+</button> : <p>.</p>}
      </div>
      <h1>TODAY'S TODOS</h1>
      <ul>
        {todos?.map((todo) => (
          <div key={todo._id} className="buttons">
            <li className={todo.completed ? "done" : ""}>
              <span>{todo.body}</span>
              <div className="buttons">
                <span
                  className={`status ${
                    todo.completed ? "done-status" : "progress-status"
                  }`}
                >
                  {todo.completed ? "DONE" : "IN PROGRESS"}
                </span>
              </div>
            </li>
            <div>
              <button className="check-btn" onClick={() => updateTodo(todo)}>
                {!isUpdating ? <GoCheckCircleFill /> : <p>loading...</p>}
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteTodo(todo._id)}
              >
                {!isDeleting ? <TbTrashXFilled /> : <p>?</p>}
              </button>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
