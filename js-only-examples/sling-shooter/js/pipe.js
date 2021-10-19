export const pipe = (argument, functions) =>
  functions.reduce((acc, f) => f(acc), argument);
