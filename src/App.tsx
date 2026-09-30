import { ToastContainer } from "react-toastify";
import "./App.css";
import SubmitFormHost from "./components/model/SubmitFormModal/SubmitFormHost";
import { ThemeProvider } from "./components/ThemeContext";
import RoutesIndex from "./Routes/RoutesIndex";
function App() {
  return (
    <>
      <ThemeProvider>
        <div className="">
          <RoutesIndex />
        </div>
        <SubmitFormHost />
        <ToastContainer />
      </ThemeProvider>
    </>
  );
}
export default App;