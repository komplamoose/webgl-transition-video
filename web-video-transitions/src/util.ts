export const pipe = (...fns : any[]) => (initialValue : any) => {
  return fns.reduce((accumulator, fn) => fn(accumulator), initialValue);
};

export const linearInterpolation = (startValue : number, endValue : number , t : number) : number => {
  return startValue + (endValue - startValue) * t;
}