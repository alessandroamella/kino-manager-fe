import Header from './Header';
import App from '../App';
import Footer from './Footer';

const Layout = () => {
  return (
    <>
      <Header />
      <p className="text-white w-52 mx-auto mt-4 text-center font-medium text-wrap bg-red-500">
        TODO: usa giallo del logo come primary color
      </p>
      <App />
      <Footer />
    </>
  );
};

export default Layout;
