export const pipe = (...fns : any[]) => (initialValue : any) => {
  return fns.reduce((accumulator, fn) => fn(accumulator), initialValue);
};

export const linearInterpolation = (startValue : number, endValue : number , t : number) : number => {
  return startValue + (endValue - startValue) * t;
}

export const getAssets = (video: AssetVideoModel) => {
  const assets: CanvasAsset[] = [];
  for (let i = 0; i < video.images.length; i++) {
    const img = new Image();
    img.src = video.images[i].src;
    assets.push({ model: video.images[i], element: img });
  }
  return assets;
};
