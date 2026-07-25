import { ToastContainer } from "react-toastify";
import "./App.css";
import { ThemeProvider } from "./components/ThemeContext";
import RoutesIndex from "./Routes/RoutesIndex";
function App() {
  return (
    <>
      <ThemeProvider>
        <div className="">
          <RoutesIndex />
        </div>
        <ToastContainer />
      </ThemeProvider>
    </>
  );
}
export default App;