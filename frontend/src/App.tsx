import { Route, Routes } from "react-router-dom";
import AdminBooks from "./components/AdminBooks";
import BookList from "./components/BookList";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BookList />} />
      <Route path="/adminbooks" element={<AdminBooks />} />
    </Routes>
  );
}
