import { Button, ButtonProps } from '@heroui/react';
import { FiMoon, FiSun } from 'react-icons/fi';
import useThemeStore from '../../store/theme';
import { cn } from '@/lib/utils';
import { useTheme } from '@heroui/use-theme';

const ToggleTheme = ({ className, ...rest }: ButtonProps) => {
  const theme = useThemeStore((store) => store.theme);
  const _toggleTheme = useThemeStore((store) => store.toggleTheme);

  const { setTheme: setHeroUITheme } = useTheme();

  const toggleTheme = () => {
    setHeroUITheme(theme === 'dark' ? 'light' : 'dark');
    _toggleTheme();
  };

  const isDarkMode = theme === 'dark';

  return (
    <Button
      onPress={toggleTheme}
      variant="ghost"
      className={cn(className, 'min-w-0')}
      {...rest}
    >
      {isDarkMode ? <FiSun /> : <FiMoon />}
    </Button>
  );
};

export default ToggleTheme;
