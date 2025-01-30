import { useEffect } from 'react';

interface Props {
  elem?: Element | null;
  delay?: number;
}

function f(props?: Props) {
  if (props?.elem) {
    props.elem.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
  } else {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}

const ScrollTop = ({ delay = 50, elem }: Props) => {
  useEffect(() => {
    // wait for the page to render
    const t = setTimeout(() => f({ elem }), delay);
    return () => clearTimeout(t);
  }, [delay, elem]);

  return null;
};

ScrollTop.scrollTop = f;

export default ScrollTop;
