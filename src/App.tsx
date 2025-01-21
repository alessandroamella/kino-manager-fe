import { useTheme } from '@heroui/use-theme';
import { Outlet } from 'react-router';

const App = () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const { theme } = useTheme();

  return (
    <main className={`${theme} text-foreground bg-background`}>
      <Outlet />
    </main>
  );
};

export default App;
