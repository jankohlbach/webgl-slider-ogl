import Slider from './elements/slider';

const sliders = document.querySelectorAll('.slider');

sliders.forEach((slider) => {
  // eslint-disable-next-line no-new
  new Slider(slider);
});
