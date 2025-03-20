import { Outlet } from 'react-router';
import Footer from '../footer';
import Header from '../header';

const Layout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;
