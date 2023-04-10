export const pipe = (...fns : any[]) => (initialValue : any) => {
  return fns.reduce((accumulator, fn) => fn(accumulator), initialValue);
};