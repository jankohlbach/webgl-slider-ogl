import {
  Renderer,
  Camera,
  Transform,
  Plane,
} from 'ogl';
import normalizeWheel from 'normalize-wheel';

import SliderItem from './sliderItem';

const loadImages = (paths, whenLoaded) => {
  const imgs = new Map();

  paths.forEach((path, i) => {
    const img = new Image();

    img.onload = () => {
      imgs.set(i, { path, img });

      if (imgs.size === paths.length) whenLoaded(imgs);
    };

    img.src = path;
  });
};

const debounce = (fn, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { fn.apply(this, args); }, timeout);
  };
};

const lerp = (a, b, n) => (1 - n) * a + n * b;

class Slider {
  constructor(slider) {
    this.slider = slider;

    this.slides = JSON.parse(this.slider.querySelector('.webgl-slides').innerHTML).slides;

    this.scroll = {
      ease: 0.04,
      current: 0,
      target: 0,
      last: 0,
    };

    ['onResize', 'update', 'onWheel', 'onTouchDown', 'onTouchMove', 'onTouchUp'].forEach((fn) => { this[fn] = this[fn].bind(this); });

    this.init();
  }

  init() {
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.update();
    this.createGeometry();
    this.createSliderItems();

    window.addEventListener('resize', debounce(this.onResize));

    this.slider.addEventListener('mousewheel', this.onWheel);
    this.slider.addEventListener('wheel', this.onWheel);

    this.slider.addEventListener('mousedown', this.onTouchDown);
    this.slider.addEventListener('mousemove', this.onTouchMove);
    this.slider.addEventListener('mouseup', this.onTouchUp);

    this.slider.addEventListener('touchstart', this.onTouchDown);
    this.slider.addEventListener('touchmove', this.onTouchMove);
    this.slider.addEventListener('touchend', this.onTouchUp);
  }

  createRenderer() {
    this.renderer = new Renderer();

    this.gl = this.renderer.gl;
    this.gl.clearColor(0.79, 0.79, 0.74, 1);

    this.slider.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl, { fov: 45 });
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      widthSegments: 100,
      heightSegments: 50,
    });
  }

  createSliderItems() {
    loadImages(this.slides.map((slide) => slide.image.src), (images) => {
      this.sliderItems = [...images.values()].map((image, index) => new SliderItem({
        gl: this.gl,
        viewport: this.viewport,
        image: image.img,
        geometry: this.planeGeometry,
        scene: this.scene,
        screen: this.screen,
        perScreen: 3,
        aspectRatio: { x: 2, y: 3 },
        gap: 0.1,
        length: images.size,
        index,
      }));
    });
  }

  onWheel(e) {
    const normalizedWheel = normalizeWheel(e);
    const speed = normalizedWheel.pixelY;

    this.scroll.target += speed * 0.02;
  }

  onTouchDown(e) {
    this.isTouchDown = true;
    this.scroll.start = e.touches ? e.touches[0].clientX : e.clientX;
  }

  onTouchMove(e) {
    if (!this.isTouchDown) { return; }

    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.scroll.start - x) * 0.05;

    this.scroll.target = this.scroll.current + distance;
  }

  onTouchUp() {
    this.isTouchDown = false;
  }

  onResize() {
    this.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.renderer.setSize(this.screen.width, this.screen.height);

    this.camera.perspective({ aspect: this.gl.canvas.width / this.gl.canvas.height });

    const fov = this.camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;

    this.viewport = { width, height };

    this.sliderItems?.forEach((sliderItem) => {
      sliderItem.onResize({ screen: this.screen, viewport: this.viewport });
    });
  }

  update() {
    this.renderer.render({
      scene: this.scene,
      camera: this.camera,
    });

    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);

    this.scroll.direction = this.scroll.current < this.scroll.last ? 1 : -1;

    if (this.scroll.direction === -1) {
      this.scroll.target += 0.02;
    } else {
      this.scroll.target -= 0.02;
    }

    this.sliderItems?.forEach((sliderItem) => {
      sliderItem.update(this.scroll);
    });

    this.scroll.last = this.scroll.current;

    window.requestAnimationFrame(this.update);
  }
}

export default Slider;
