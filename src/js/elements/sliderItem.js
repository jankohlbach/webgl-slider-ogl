import {
  Texture,
  Program,
  Mesh,
} from 'ogl';

import vertex from './vertex.glsl';
import fragment from './fragment.glsl';

class SliderItem {
  constructor({
    gl,
    viewport,
    image,
    geometry,
    scene,
    screen,
    perScreen,
    aspectRatio,
    gap,
    length,
    index,
  }) {
    this.gl = gl;
    this.viewport = viewport;
    this.image = image;
    this.geometry = geometry;
    this.scene = scene;
    this.screen = screen;
    this.perScreen = perScreen;
    this.aspectRatio = aspectRatio;
    this.gap = gap;
    this.length = length;
    this.index = index;

    this.init();
  }

  init() {
    this.createShader();
    this.createMesh();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: false });

    this.program = new Program(this.gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [0, 0] },
        uViewportSizes: { value: [this.viewport.width, this.viewport.height] },
      },
      transparent: true,
    });

    texture.image = this.image;
    this.program.uniforms.uImageSizes.value = [this.image.naturalWidth, this.image.naturalHeight];
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });

    this.plane.setParent(this.scene);
  }

  onResize({ screen, viewport } = {}) {
    if (screen) {
      this.screen = screen;
    }

    if (viewport) {
      this.viewport = viewport;
      this.plane.program.uniforms.uViewportSizes.value = [
        this.viewport.width, this.viewport.height,
      ];
    }

    const responsiveGap = this.gap * this.viewport.width;

    this.plane.scale.x = this.viewport.width / this.perScreen - responsiveGap;
    this.plane.scale.y = this.plane.scale.x / (this.aspectRatio.x / this.aspectRatio.y);

    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

    this.width = this.plane.scale.x + responsiveGap;
    this.widthTotal = this.width * this.length;

    this.x = (-this.viewport.width / 2 + this.width / 2) + this.index * this.width;
  }

  update(scroll) {
    this.plane.position.x = this.x - scroll.current;

    const boundsCheck = scroll.direction === -1
      ? Math.ceil(this.plane.position.x + (this.width / 2))
      : Math.ceil(this.plane.position.x - (this.width / 2));

    if (boundsCheck !== 0 && boundsCheck % Math.ceil(this.viewport.width / 2) === 0) {
      if (scroll.direction === -1 && Math.sign(this.plane.position.x) === -1) {
        this.x += this.widthTotal;
      } else if (scroll.direction === 1 && Math.sign(this.plane.position.x) === 1) {
        this.x -= this.widthTotal;
      }
    }
  }
}

export default SliderItem;
