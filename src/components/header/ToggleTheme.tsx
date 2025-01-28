import { Button, ButtonProps } from '@heroui/react';
import { FiMoon, FiSun } from 'react-icons/fi';
import useThemeStore from '../../store/theme';
import { cn } from '@/lib/utils';

const ToggleTheme = ({ className, ...rest }: ButtonProps) => {
  const theme = useThemeStore((store) => store.theme);
  const toggleTheme = useThemeStore((store) => store.toggleTheme);

  const isDarkMode = theme === 'dark';

  return (
    <Button
      onPress={toggleTheme}
      variant="ghost"
      className={cn(className, {
        'min-w-0': true,
        'text-white hover:bg-zinc-700': isDarkMode,
        'text-gray-700 hover:bg-gray-200': !isDarkMode,
      })}
      {...rest}
    >
      {isDarkMode ? <FiSun /> : <FiMoon />}
    </Button>
  );
};

export default ToggleTheme;
