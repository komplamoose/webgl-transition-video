import video3 from './assets/video3.mp4'
import video4 from './assets/video4.mp4'
import image1 from './assets/image1.jpeg'
import image2 from './assets/image2.png'
import image3 from './assets/image3.png'
import image4 from './assets/image4.png'



const dummyVideoModel1 : AssetVideoModel = {
  src : video3,
  width : 640,
  height : 360,
  images : [
    {
      src : image1,
      width : 100,
      height : 100,
      xPos : 200,
      yPos : 200,
      rotation : 0,
      zIndex : 0
    },
    {
      src : image2,
      width : 100,
      height : 100,
      xPos : 150,
      yPos : 100,
      rotation : 0,
      zIndex : 1
    },
  ]
};

const dummyVideoModel2 : AssetVideoModel = {
  src : video4,
  width : 640,
  height : 360,
  images : [
    {
      src : image3,
      width : 100,
      height : 100,
      xPos : 100,
      yPos : 100,
      rotation : 0,
      zIndex : 2
    },
    {
      src : image4,
      width : 100,
      height : 100,
      xPos : 200,
      yPos : 250,
      rotation : 0,
      zIndex : 3
    },
  ]
};

export { dummyVideoModel1, dummyVideoModel2 }