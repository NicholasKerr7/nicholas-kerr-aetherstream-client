import "./App.scss";
import Header from "./components/header/Header";
import Hero from "./components/hero/Hero";
import Article from "./components/article/Article";
import Form from "./components/form/Form";

function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <Article />
      <Form />
    </div>
  );
}

export default App;
