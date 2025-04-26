import TodoList from "./components/TodoList";

export const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api";

function App() {
  return (
    <>
      {/* <TodoForm /> */}
      <TodoList />
    </>
  );
}

export default App;
