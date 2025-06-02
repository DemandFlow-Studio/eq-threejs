import * as THREE from 'https://unpkg.com/three@0.125.2/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.125.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.125.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three@0.125.2/examples/jsm/loaders/DRACOLoader.js';

let scene, camera, renderer;
let orbitControls;
const cardMeshes = {};

// Expose variables globally for floating animations
window.cardModel = null;
window.floatingAnimations = null;
 
window.cardState = window.cardState || {
  tab: 'customize',
  customDesign: 'duotone',
  classicColor: '#04091B',
  customColorOne: '#FFB900',
  customColorTwo: '#111427',
  customGradientType: 'radial',
  customGradientColorOne: '#667ED8',
  customGradientColorTwo: '#69F7DB',
  selectedTemplateId: null,
  name: 'Your Name',
  logoUrl: null,
  _currentLogoObjectUrl: null,
  logoPosition: 'center'
};

// Function to update camera zoom based on current canvas and orientation
window.updateCameraZoom = function () {
  if (!window.camera || !window.renderer || !window.renderer.domElement ||
    !window.scene || !window.cardModel || !window.cardModel.userData.scaledSize) {
    // Prerequisites not met, e.g., model not loaded yet
    return;
  }

  const modelScaledSize = window.cardModel.userData.scaledSize;
  const canvasEl = window.renderer.domElement;
  const currentWidth = canvasEl.offsetWidth;
  const currentHeight = canvasEl.offsetHeight;

  if (currentWidth === 0 || currentHeight === 0) return; // Avoid division by zero if canvas is hidden

  window.camera.aspect = currentWidth / currentHeight;

  const fov = window.camera.fov * (Math.PI / 180);
  const cameraDistanceForHeight = modelScaledSize.y / (2 * Math.tan(fov / 2));
  const cameraDistanceForWidth = modelScaledSize.x / (2 * Math.tan(fov / 2) * window.camera.aspect);

  let zoomFactor = 1.5; // Default zoom factor for portrait/desktop

  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  const screenWidth = window.innerWidth; // Use direct screen width for more granular control

  if (screenWidth <= 767 && !isLandscape) {
    zoomFactor = 1.8;
  }

  if (screenWidth <= 479 && !isLandscape) {
    zoomFactor = 1.9;
  }


  if (isLandscape) {
    if (screenWidth <= 767) { // Mobile landscape (e.g., phones)
      // Previously 2.8 made it too small. Reducing to make model appear larger.
      zoomFactor = 1.5;
    } else if (screenWidth <= 1250) { // Tablet landscape
      // Previously 2.8. Reducing, but less than mobile, to make model appear larger.
      zoomFactor = 1.8;
    }
    // For landscape screens wider than 1250px, the default zoomFactor of 1.8 will apply if they are not caught by other conditions.
  }

  window.camera.position.z = Math.max(cameraDistanceForHeight, cameraDistanceForWidth) * zoomFactor;
  window.camera.lookAt(window.scene.position); // Ensure camera always looks at the center of the scene
  window.camera.updateProjectionMatrix();

  if (window.orbitControls) {
    window.orbitControls.update();
  }
};

// Initialize LoadingManager
const loadingManager = new THREE.LoadingManager();

// Variables for smooth percentage animation and minimum duration
let currentProgress = 0;
let targetProgress = 0;
let maxProgressReached = 0; // Track maximum progress to prevent decreasing
let loadingStartTime = Date.now();
let loadingComplete = false;
let progressComplete = false;
let smoothProgressAnimation = null;
const MIN_LOADING_DURATION = 5000; // 5 seconds minimum

// Function to create smooth progress animation
function startSmoothProgress() {
  const progressElement = document.getElementById('loader-percentage');
  const progressBar = document.getElementById('loader-progress-bar');

  if (!progressElement || !progressBar) return;

  let progress = 0;
  const startTime = Date.now();
  const duration = MIN_LOADING_DURATION; // Always take exactly 5 seconds

  function updateProgress() {
    const elapsed = Date.now() - startTime;

    // Use easing function for smooth, natural progress
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    const normalizedTime = Math.min(elapsed / duration, 1);
    progress = easeOutQuart(normalizedTime) * 100;

    // Update UI
    progressElement.textContent = Math.round(progress) + '%';
    progressBar.style.width = Math.round(progress) + '%';

    // Check if progress animation is complete
    if (normalizedTime >= 1) {
      progressComplete = true;
      progress = 100;
      progressElement.textContent = '100%';
      progressBar.style.width = '100%';

      // If both progress and loading are complete, hide loader
      if (loadingComplete) {
        hideLoader();
      }
      return; // Stop the animation
    }

    // Continue animation
    smoothProgressAnimation = requestAnimationFrame(updateProgress);
  }

  updateProgress();
}

// Function to hide the loader
function hideLoader() {
  const loaderElement = document.getElementById('loader');
  const logoImg = document.querySelector('.loader-logo-img');

  if (loaderElement) {
    // Start the logo scale-out animation
    if (logoImg) {
      logoImg.classList.add('scale-out');
    }

    // Start fade out of the entire loader
    loaderElement.classList.add('hidden');

    // Start the 3D card reveal animation early - during loader fade-out instead of after
    setTimeout(() => {
      if (window.cardModel && window.startCardRevealAnimation) {
        window.startCardRevealAnimation();
      }
    }, 50); // Start reveal animation much earlier (150ms instead of 500ms)

    // Remove from DOM after transition completes
    setTimeout(() => {
      loaderElement.classList.add('hide-loader');
    }, 500); // Still remove after full transition
  }
}

// Function to complete progress animation (simplified)
function completeProgress() {
  // Just mark loading as complete, let the timing logic handle the rest
  if (smoothProgressAnimation) {
    cancelAnimationFrame(smoothProgressAnimation);
  }
}

loadingManager.onLoad = function () {
  // Mark loading as complete
  loadingComplete = true;

  // If progress animation is also complete, hide loader immediately
  if (progressComplete) {
    hideLoader();
  }
  // Otherwise, wait for progress animation to complete (it will call hideLoader)

  // Note: 3D card reveal animation is now triggered after loader is hidden
  // No longer triggered here immediately
};

loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  // We no longer update progress here - smooth animation handles it
  // This just tracks that loading is happening
};

loadingManager.onError = function (url) {
  // Optionally, hide the loader and show an error message
  const loaderElement = document.getElementById('loader');
  if (loaderElement) {
    loaderElement.style.display = 'none';
  }
  // You could display an error message in the UI here
  alert('Failed to load essential 3D assets. Please try refreshing the page.');
};


// Initialize logo from localStorage if available
function initializeLogoFromStorage() {
  if (window.logoStorage && window.logoStorage.load) {
    const storedLogoUrl = window.logoStorage.load();
    if (storedLogoUrl) {
      window.cardState.logoUrl = storedLogoUrl;
      window.cardState._currentLogoObjectUrl = storedLogoUrl;
    }
  }
}

const templates = {
  '01': { design: 'classic', colorOne: '#4769FD' },
  '02': { design: 'duotone', colorOne: '#F65555', colorTwo: '#FC8C8C' },
  '03': { design: 'gradient', gradientType: 'radial', gradientColorOne: '#73C044', gradientColorTwo: '#24C0D5' },
  '04': { design: 'gradient', gradientType: 'linear', gradientColorOne: '#F4A41B', gradientColorTwo: '#FA3D31' },
  '05': { design: 'gradient', gradientType: 'radial', gradientColorOne: '#0037FF', gradientColorTwo: '#B919BE' },
  '06': { design: 'classic', colorOne: '#FFB900' },
};

function initThreeJS() {
  const canvas = document.getElementById('canvas');
  if (!canvas) { return; }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Expose renderer, scene, and camera globally for download functionality
  window.renderer = renderer;
  window.scene = scene;
  window.camera = camera;

  new ResizeObserver(() => {
    if (renderer && camera && canvas && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
      if (window.updateCameraZoom) window.updateCameraZoom();
    }
  }).observe(canvas);

  // Listen for orientation changes to adjust camera zoom
  window.addEventListener('orientationchange', () => {
    // Use a small timeout to allow the browser to update dimensions before recalculating zoom
    setTimeout(() => {
      if (window.updateCameraZoom) window.updateCameraZoom();
    }, 100);
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Add additional lighting for more dynamic floating effect
  const rimLight = new THREE.DirectionalLight(0x4a90e2, 0.3);
  rimLight.position.set(-5, 5, -5);
  scene.add(rimLight);

  // Add subtle point light that will move with the card for organic lighting
  const followLight = new THREE.PointLight(0xffffff, 0.2, 5);
  followLight.position.set(0, 2, 2);
  scene.add(followLight);

  // Store reference for animation
  window.followLight = followLight;

  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableZoom = false;
  orbitControls.enablePan = false;
  // Allow more natural rotation range for better interaction
  orbitControls.minPolarAngle = Math.PI / 2 - Math.PI / 4; // 45 degrees above horizontal
  orbitControls.maxPolarAngle = Math.PI / 2 + Math.PI / 4; // 45 degrees below horizontal
  orbitControls.target.set(0, 0, 0);

  // Enhanced smooth dampening for premium feel
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08; // Increased dampening for smoother motion
  orbitControls.rotateSpeed = 0.4; // Slightly increased for better responsiveness
  orbitControls.autoRotate = false; // Disable auto-rotate to let our custom animations handle it

  // Expose orbitControls globally for download functionality
  window.orbitControls = orbitControls;

  // Enhanced event listeners for better animation control
  let interactionTimeout;

  orbitControls.addEventListener('start', () => {
    if (window.floatingAnimations) {
      window.floatingAnimations.pause();
    }
    // Clear any pending resume timeout
    if (interactionTimeout) {
      clearTimeout(interactionTimeout);
    }
  });

  orbitControls.addEventListener('change', () => {
    // Reset timeout on every change to prevent premature resume
    if (interactionTimeout) {
      clearTimeout(interactionTimeout);
    }
  });

  orbitControls.addEventListener('end', () => {
    // Resume animations after user stops interacting for a moment
    interactionTimeout = setTimeout(() => {
      if (window.floatingAnimations) {
        window.floatingAnimations.resume();
      }
    }, 800); // Slightly longer delay for better UX
  });

  orbitControls.update();

  loadGLTFModel();
}

function animate() {
  requestAnimationFrame(animate);
  if (orbitControls) orbitControls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}



function loadStaticTextures() {
  const textureLoader = new THREE.TextureLoader(loadingManager); // Use loadingManager

  // Load CardBack texture
  if (cardMeshes.CardBack) {
    textureLoader.load(
      'https://files.tryflowdrive.com/eZ3ZmH8y0O_CARD_back-text.webp',
      (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        cardMeshes.CardBack.material.map = texture;
      },
      undefined,
      (error) => console.error('Error loading CardBack texture:', error)
    );
  }

  // Load metal chip texture for Chip material
  if (cardMeshes.Chip) {
    textureLoader.load(
      'https://files.tryflowdrive.com/WZku9hdbuj_metal-texture-chip.jpg',
      (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        cardMeshes.Chip.material.map = texture;
      },
      undefined,
      (error) => console.error('Error loading Chip texture:', error)
    );
  }

  // Load Mastercard texture for LogoMastercard material
  if (cardMeshes.LogoMastercard) {
    const textureUrl = 'https://files.tryflowdrive.com/nB890ePttC_MASTERCARD.png';

    textureLoader.load(
      textureUrl,
      (texture) => {
        // Dispose of the old material and its map if they exist
        if (cardMeshes.LogoMastercard.material) {
          if (cardMeshes.LogoMastercard.material.map) {
            cardMeshes.LogoMastercard.material.map.dispose();
          }
          cardMeshes.LogoMastercard.material.dispose();
        }

        // Configure texture properties (same pattern as logo textures)
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat; // Ensure alpha channel is preserved
        texture.premultiplyAlpha = false; // Prevent alpha premultiplication issues

        // Ensure consistent texture orientation
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        texture.needsUpdate = true;

        // Use MeshBasicMaterial for the Mastercard logo (same pattern as user logo)
        cardMeshes.LogoMastercard.material = new THREE.MeshBasicMaterial({
          map: texture,
          color: 0xffffff,      // Ensure no tinting from material color
          transparent: true,    // Enable transparency
          depthWrite: false,    // Helps with rendering transparent textures
          alphaTest: 0.1        // Discard pixels with very low alpha
        });
        cardMeshes.LogoMastercard.material.needsUpdate = true;
        cardMeshes.LogoMastercard.renderOrder = 999; // Force higher render order for transparency

        cardMeshes.LogoMastercard.visible = false;
      },
      undefined,
      (error) => {
        console.error('Error loading Mastercard texture:', error);
        // Dispose of the old material and its map if they exist
        if (cardMeshes.LogoMastercard.material) {
          if (cardMeshes.LogoMastercard.material.map) {
            cardMeshes.LogoMastercard.material.map.dispose();
          }
          cardMeshes.LogoMastercard.material.dispose();
        }
        // Assign a default transparent material or just hide
        cardMeshes.LogoMastercard.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
        cardMeshes.LogoMastercard.visible = false;
      }
    );
  }
}

// Function to start the card reveal animation (called after loader is hidden)
window.startCardRevealAnimation = function () {
  if (!window.cardModel || !window.gsap) {
    return;
  }

  // Reveal animation for the 3D card model
  if (typeof window.cardModel.userData.finalYPosition !== 'undefined') {
    const finalY = window.cardModel.userData.finalYPosition;
    const finalRotationX = window.cardModel.userData.finalRotationX;
    const finalRotationY = window.cardModel.userData.finalRotationY;
    const finalRotationZ = window.cardModel.userData.finalRotationZ;

    // Prepare materials for opacity animation just before starting
    const materialsToAnimateDetails = [];
    window.cardModel.traverse(child => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        materialsToAnimateDetails.push({
          material: mat,
          originalOpacity: mat.opacity, // Capture current opacity set by updateCardModelFromState
          originalTransparent: mat.transparent // Capture original transparent state
        });
        mat.opacity = 0;
        mat.transparent = true;
      }
    });

    window.cardModel.visible = true; // Make model visible now that it's ready to be animated

    const revealTl = gsap.timeline({
      onComplete: () => {
        // Initialize floating animations after reveal is complete
        if (window.initFloatingAnimations) {
          window.initFloatingAnimations();
        }

        // Start the rotation hint animation
        const rotationCue = document.getElementById('rotation-cue');
        if (window.cardModel && rotationCue) {
          const initialRotationY = window.cardModel.rotation.y;
          const hintTl = gsap.timeline();

          // Position the cue with JS before it becomes visible to avoid flash
          positionRotationCue();

          // Show text cue
          hintTl.to(rotationCue, {
            className: 'rotation-cue visible',
            duration: 0.5,
            onComplete: () => {
              positionRotationCue(); // Re-position just in case & add listeners
              addPositioningListeners();
            }
          }, 0);

          // Rotate card slightly for hint
          const swing = Math.PI / 10; // ~18° swing (Math.PI / 10 is approx 18 degrees)
          hintTl.to(window.cardModel.rotation, { y: initialRotationY - swing, duration: 0.6, ease: 'sine.inOut' }, 0.2) // Start this animation slightly after text cue appears
            .to(window.cardModel.rotation, { y: initialRotationY + swing, duration: 1.2, ease: 'sine.inOut' })
            .to(window.cardModel.rotation, { y: initialRotationY, duration: 0.6, ease: 'sine.inOut' });

          // Hide text cue after a delay
          hintTl.to(rotationCue, { className: 'rotation-cue', duration: 0.5 }, '>+0.5');
        }
      }
    });

    revealTl.to(window.cardModel.position, {
      y: finalY,
      duration: 1.5,
      ease: "power2.out"
    }, 0);

    revealTl.to(window.cardModel.rotation, {
      x: finalRotationX,
      y: finalRotationY,
      z: finalRotationZ,
      duration: 1.8,
      ease: "power2.out"
    }, 0);

    materialsToAnimateDetails.forEach(item => {
      revealTl.to(item.material, {
        opacity: item.originalOpacity,
        duration: 1.5,
        ease: "power2.out"
      }, 0.2);
    });

  } else {
    // Fallback: if reveal animation can't run, ensure model is visible
    if (window.cardModel) {
      window.cardModel.visible = true;
    }
    if (window.initFloatingAnimations) {
      window.initFloatingAnimations();
    }
  }
};

function loadGLTFModel() {
  const dracoLoader = new DRACOLoader(); // DRACOLoader doesn't use LoadingManager directly
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  const gltfLoader = new GLTFLoader(loadingManager); // Use loadingManager
  gltfLoader.setDRACOLoader(dracoLoader);

  const modelUrl = 'https://files.tryflowdrive.com/CAh3H4z8LD_card-model.glb';
  gltfLoader.load(modelUrl, (gltf) => {
    window.cardModel = gltf.scene;
    window.cardModel.traverse(child => {
      if (child.isMesh) {
        if (child.name === 'CardBase') cardMeshes.CardBase = child;
        if (child.name === 'CardBack') cardMeshes.CardBack = child;
        if (child.name === 'CardName') cardMeshes.CardName = child;
        if (child.name === 'LogoCenter') cardMeshes.LogoCenter = child;
        if (child.name === 'LogoTopRight') cardMeshes.LogoTopRight = child; // Store though not used yet
        if (child.name === 'LogoRight') cardMeshes.LogoRight = child;
        if (child.name === 'Chip') cardMeshes.Chip = child;
        if (child.name === 'ChipBase') cardMeshes.ChipBase = child;
        if (child.name === 'LogoMastercard') cardMeshes.LogoMastercard = child;

        // Set up materials based on mesh type
        if (child.name === 'CardName') {
          // Special transparent material for text
          child.material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0, // Start invisible until text is applied
            alphaTest: 0.1,
            depthWrite: false,
            side: THREE.DoubleSide
          });
        } else if (child.name === 'ChipBase') {
          // Dark material for ChipBase - preserve existing texture map if present
          const existingMap = child.material ? child.material.map : null;
          child.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#1a1a1a'),
            roughness: 0.4,
            metalness: 1,
            reflectivity: 0.4,
            clearcoat: 0.1,
            clearcoatRoughness: 0.2,
            side: THREE.DoubleSide,
            map: existingMap,
          });
        } else {
          // Standard material for other meshes
          child.material = new THREE.MeshStandardMaterial({
            roughness: 0.5,
            metalness: 0.3,
            transparent: true, // Key for allowing texture alpha
            // color: 0xffffff // Base color, good for textures not to be tinted
          });
        }
      }
    });

    const box = new THREE.Box3().setFromObject(window.cardModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    window.cardModel.position.sub(center); // Center the model
    window.cardModel.position.y -= (box.max.y + box.min.y) / 2; // Center vertically in view

    // Adjust scaling
    const maxDim = Math.max(size.x, size.y, size.z);
    const desiredVisibleHeight = 2.5; // How tall you want the card to appear in scene units
    const scale = desiredVisibleHeight / size.y; // Scale based on model's height to a desired visible height
    window.cardModel.scale.set(scale, scale, scale);

    // Adjust camera position to fit the scaled model
    // Calculate distance needed to fit the model's new height based on camera FOV
    const scaledBox = new THREE.Box3().setFromObject(window.cardModel);
    const scaledSize = scaledBox.getSize(new THREE.Vector3());
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistanceForHeight = scaledSize.y / (2 * Math.tan(fov / 2));
    const cameraDistanceForWidth = scaledSize.x / (2 * Math.tan(fov / 2) * camera.aspect);
    camera.position.z = Math.max(cameraDistanceForHeight, cameraDistanceForWidth) * 1.8; // Use larger distance + a bit more space

    // Store scaledSize in userData for updateCameraZoom to access
    window.cardModel.userData.scaledSize = scaledSize.clone();

    camera.lookAt(scene.position); // Ensure camera looks at the origin (where model is centered)
    orbitControls.target.copy(scene.position); // Ensure controls target the model center
    orbitControls.update();

    // Store final position and rotation in userData for reveal animation
    window.cardModel.userData.finalYPosition = window.cardModel.position.y;
    window.cardModel.userData.finalRotationX = window.cardModel.rotation.x;
    window.cardModel.userData.finalRotationY = window.cardModel.rotation.y;
    window.cardModel.userData.finalRotationZ = window.cardModel.rotation.z;

    // Set starting position and rotation for reveal animation
    window.cardModel.position.y -= 1.75; // Start below its final position
    window.cardModel.rotation.x -= Math.PI / 10; // Initial slight X rotation (e.g., tilt forward/backward)
    window.cardModel.rotation.y -= Math.PI / 15; // Initial Y rotation (side to side)
    window.cardModel.rotation.z += Math.PI / 90; // Initial slight Z rotation (e.g., tilt sideways)
    window.cardModel.visible = false; // Start invisible

    scene.add(window.cardModel);

    // Load and apply textures for Chip and LogoMastercard materials
    // ✅ Call after cardMeshes are populated to ensure meshes exist
    loadStaticTextures();

    updateCardModelFromState();

    // Initial call to set camera zoom correctly after model loading and scaling
    if (window.updateCameraZoom) window.updateCameraZoom();

    // Model is now prepared and ready for reveal animation
    // The reveal animation will be triggered by LoadingManager.onLoad after loader is hidden
    // For now, keep the model invisible until reveal animation starts

    animate(); // Start the animation loop once the primary model is loaded and processed
  }, undefined, (error) => console.error('GLTF Load Error:', error));
}

window.updateCardModelFromState = function () { // Exposed globally
  if (!window.cardModel || !cardMeshes.CardBase) return;

  // Helper functions for luminance-based text color
  function getLuminance(hex) {
    // Convert hex to RGB
    const rgb = hex.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16) / 255);
    // Apply sRGB formula
    const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function getContrastTextColor(bgHex) {
    const luminance = getLuminance(bgHex);
    return luminance > 0.5 ? '#000000' : '#FFFFFF'; // Black text on light bg, white on dark
  }

  function getAverageColorFromGradient(colorOne, colorTwo) {
    // Simple average of two colors for gradient backgrounds
    const rgb1 = colorOne.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));
    const rgb2 = colorTwo.replace('#', '').match(/.{2}/g).map(x => parseInt(x, 16));

    const avgR = Math.round((rgb1[0] + rgb2[0]) / 2);
    const avgG = Math.round((rgb1[1] + rgb2[1]) / 2);
    const avgB = Math.round((rgb1[2] + rgb2[2]) / 2);

    return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  }

  let activeState = {};
  const state = window.cardState;
  if (state.tab === 'templates' && state.selectedTemplateId && templates[state.selectedTemplateId]) {
    const T = templates[state.selectedTemplateId];
    Object.assign(activeState, T, { name: state.name, logoUrl: state._currentLogoObjectUrl || state.logoUrl, logoPosition: state.logoPosition });
  } else {
    Object.assign(activeState, {
      design: state.customDesign,
      colorOne: state.customDesign === 'classic' ? state.classicColor : state.customColorOne,
      colorTwo: state.customColorTwo,
      gradientType: state.customGradientType, gradientColorOne: state.customGradientColorOne,
      gradientColorTwo: state.customGradientColorTwo, name: state.name,
      logoUrl: state._currentLogoObjectUrl || state.logoUrl, // Ensure logoUrl is correctly sourced
      logoPosition: state.logoPosition // Pass logoPosition to activeState
    });
  }

  // Determine text color based on background design
  let textColor = '#FFFFFF'; // Default white

  if (activeState.design === 'classic') {
    textColor = getContrastTextColor(activeState.colorOne || '#CCC');
  } else if (activeState.design === 'duotone') {
    // For duotone, the text is positioned on the left side (colorOne area)
    // So use colorOne to determine contrast, not the average
    textColor = getContrastTextColor(activeState.colorOne || '#CCC');
  } else if (activeState.design === 'gradient') {
    // For gradients, use the average of both gradient colors
    const avgColor = getAverageColorFromGradient(
      activeState.gradientColorOne || '#667ED8',
      activeState.gradientColorTwo || '#69F7DB'
    );
    textColor = getContrastTextColor(avgColor);
  }

  const bgCanvas = document.createElement('canvas');
  const bgCtx = bgCanvas.getContext('2d');
  bgCanvas.width = 512; bgCanvas.height = 288;

  if (activeState.design === 'classic') {
    bgCtx.fillStyle = activeState.colorOne || '#CCC';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  } else if (activeState.design === 'duotone') {
    const w = bgCanvas.width;
    const h = bgCanvas.height;
    const leftWidth = Math.round(w * 0.5);
    const rightWidth = w - leftWidth; // ensures exact total width

    bgCtx.fillStyle = activeState.colorOne || '#CCC';
    bgCtx.fillRect(0, 0, leftWidth, h);

    bgCtx.fillStyle = activeState.colorTwo || '#AAA';
    bgCtx.fillRect(leftWidth, 0, rightWidth, h);


  } else if (activeState.design === 'gradient') {
    let grad;

    if (activeState.gradientType === 'linear') {
      // Create diagonal linear gradient for more dynamic effect (similar to your example)
      // Using diagonal direction (0,0 to width*0.75, height*0.4) for better visual impact
      grad = bgCtx.createLinearGradient(0, 0, bgCanvas.width * 0.75, bgCanvas.height * 0.4);
    } else {
      // Create radial gradient that covers the entire canvas (like your example)
      const centerX = bgCanvas.width / 2;
      const centerY = bgCanvas.height / 4;
      //const radius = Math.max(bgCanvas.width, bgCanvas.height); // Full coverage radius
      const radius = 800;
      grad = bgCtx.createRadialGradient(centerX, centerY, 40, centerX, centerY, radius);
      // console.log(radius);
    }

    // Enhanced color stops for better contrast and visual appeal
    const colorOne = activeState.gradientColorOne || '#667ED8';
    const colorTwo = activeState.gradientColorTwo || '#69F7DB';

    if (activeState.gradientType === 'linear') {
      // Linear gradient with smooth transition
      grad.addColorStop(0, colorTwo);
      grad.addColorStop(1, colorOne);
    } else {
      // Radial gradient with smooth transition from center to edge (like your example)
      grad.addColorStop(0, colorTwo);
      grad.addColorStop(0.2, colorOne); // Using 0.66 like your example for better color distribution
      //grad.addColorStop(0.6, colorOne);
    }

    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  }
  if (cardMeshes.CardBase.material.map) cardMeshes.CardBase.material.map.dispose();
  cardMeshes.CardBase.material.map = new THREE.CanvasTexture(bgCanvas);
  cardMeshes.CardBase.material.map.encoding = THREE.sRGBEncoding;
  cardMeshes.CardBase.material.color.set(0xffffff);

  if (cardMeshes.CardName) {
    if (activeState.name && activeState.name.trim()) {
      const textCanvas = document.createElement('canvas');
      const textCtx = textCanvas.getContext('2d', { alpha: true });

      // Create square canvas with power of two dimensions for optimal performance
      const canvasSize = 512; // Square dimensions
      textCanvas.width = canvasSize;
      textCanvas.height = canvasSize;

      // Ensure canvas starts completely transparent
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      // Set composite operation to ensure we preserve transparency
      textCtx.globalCompositeOperation = 'source-over';

      let currentFontSize = 48; // Start with desired font size
      const padding = 32; // Padding from edges

      // Set initial font and measure text - use consistent font family
      textCtx.font = `${currentFontSize}px 'Arial Regular', monospace`;
      let textMetrics = textCtx.measureText(activeState.name);

      // Adjust font size to fit within the square canvas with padding
      const maxTextWidth = textCanvas.width - (padding * 2);
      while (textMetrics.width > maxTextWidth && currentFontSize > 10) {
        currentFontSize -= 1.5;
        textCtx.font = `${currentFontSize}px 'Arial Regular', monospace`;
        textMetrics = textCtx.measureText(activeState.name);
      }

      // Also ensure font height fits within canvas height with padding
      const maxTextHeight = textCanvas.height - (padding * 2);
      const estimatedTextHeight = currentFontSize * 1.2; // 1.2 is line height factor
      if (estimatedTextHeight > maxTextHeight) {
        currentFontSize = Math.floor(maxTextHeight / 1.2);
        currentFontSize = Math.max(10, currentFontSize); // Ensure minimum font size
        textCtx.font = `${currentFontSize}px 'Arial Regular', monospace`;
      }

      // Clear canvas again and set up text rendering
      textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      textCtx.font = `${currentFontSize}px 'Arial Regular', monospace`;
      textCtx.fillStyle = textColor; // Use dynamic text color based on background
      textCtx.textAlign = 'left';
      textCtx.textBaseline = 'middle';

      // Draw text left-aligned with padding from the left edge
      textCtx.fillText(activeState.name, padding, textCanvas.height / 2);

      // Dispose of the old material and its map if they exist
      if (cardMeshes.CardName.material) {
        if (cardMeshes.CardName.material.map) {
          cardMeshes.CardName.material.map.dispose();
        }
        if (cardMeshes.CardName.material.bumpMap) {
          cardMeshes.CardName.material.bumpMap.dispose();
        }
        cardMeshes.CardName.material.dispose(); // Dispose the material itself
      }

      // Create texture from canvas with enhanced settings
      const textTexture = new THREE.CanvasTexture(textCanvas);
      textTexture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Better quality at angles
      textTexture.encoding = THREE.sRGBEncoding;
      textTexture.minFilter = THREE.LinearFilter;
      textTexture.magFilter = THREE.LinearFilter;
      textTexture.format = THREE.RGBAFormat; // Ensure alpha channel is preserved
      textTexture.premultiplyAlpha = false; // Prevent alpha premultiplication issues

      // Ensure consistent texture orientation
      textTexture.flipY = false;
      textTexture.wrapS = THREE.ClampToEdgeWrapping;
      textTexture.wrapT = THREE.ClampToEdgeWrapping;

      textTexture.needsUpdate = true; // Force texture update

      // Use MeshStandardMaterial for realistic "printed on credit card" look
      const printedTextMaterial = new THREE.MeshStandardMaterial({
        map: textTexture,
        color: textColor === '#FFFFFF' ? 0xf0f0f0 : 0x111111, // Slightly off-white or dark grey for realism
        metalness: 0.0,            // No metallic shine
        roughness: 0.9,            // Matte plastic feel
        transparent: true,         // Enable transparency
        depthWrite: true,
        depthTest: true,
        side: THREE.FrontSide,
        // Subtle bump map for letterpress feel (text pressed into plastic)
        bumpMap: textTexture,      // Reuse the same text texture
        bumpScale: -0.009          // Negative = pressed in
      });

      cardMeshes.CardName.material = printedTextMaterial;
      cardMeshes.CardName.renderOrder = 999; // Force higher render order for transparency

      cardMeshes.CardName.visible = true;
    } else {
      // Dispose of the old material and its map if they exist
      if (cardMeshes.CardName.material) {
        if (cardMeshes.CardName.material.map) {
          cardMeshes.CardName.material.map.dispose();
        }
        if (cardMeshes.CardName.material.bumpMap) {
          cardMeshes.CardName.material.bumpMap.dispose();
        }
        cardMeshes.CardName.material.dispose();
      }
      // Assign a default transparent material
      cardMeshes.CardName.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      cardMeshes.CardName.visible = false;
    }
  }

  // Handle logo rendering for all three positions
  const logoPosition = activeState.logoPosition || 'center'; // Use logoPosition from activeState

  // Determine which mesh is active based on position
  let activeLogo;
  if (logoPosition === 'center') {
    activeLogo = cardMeshes.LogoCenter;
  } else if (logoPosition === 'topright') {
    activeLogo = cardMeshes.LogoTopRight;
  } else if (logoPosition === 'right') {
    activeLogo = cardMeshes.LogoRight;
  }

  // Hide all inactive logo meshes
  const allLogoMeshes = [cardMeshes.LogoCenter, cardMeshes.LogoTopRight, cardMeshes.LogoRight];
  allLogoMeshes.forEach(logoMesh => {
    if (logoMesh && logoMesh !== activeLogo) {
      if (logoMesh.material) {
        if (logoMesh.material.map) {
          logoMesh.material.map.dispose();
        }
        logoMesh.material.dispose();
      }
      logoMesh.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      logoMesh.visible = false;
    }
  });

  // Handle the active logo mesh
  if (activeLogo) {
    if (activeState.logoUrl) {
      const img = new Image();
      img.onload = () => {
        const logoCanvas = document.createElement('canvas');
        const logoCtx = logoCanvas.getContext('2d', { alpha: true });
        const logoCanvasSize = 512; // Increased from 256 for better quality
        logoCanvas.width = logoCanvasSize;
        logoCanvas.height = logoCanvasSize;

        // Ensure canvas starts completely transparent
        logoCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
        // Set composite operation to ensure we preserve transparency
        logoCtx.globalCompositeOperation = 'source-over';

        // Calculate dimensions to draw image while maintaining aspect ratio
        let drawWidth, drawHeight, offsetX, offsetY;
        const imgAspectRatio = img.width / img.height;

        if (img.width / img.height > logoCanvas.width / logoCanvas.height) {
          // Image is wider relative to canvas: fit width, scale height
          drawWidth = logoCanvas.width;
          drawHeight = (logoCanvas.width / img.width) * img.height;
        } else {
          // Image is taller or same relative aspect: fit height, scale width
          drawHeight = logoCanvas.height;
          drawWidth = (logoCanvas.height / img.height) * img.width;
        }
        offsetX = (logoCanvas.width - drawWidth) / 2;
        offsetY = (logoCanvas.height - drawHeight) / 2;

        logoCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Dispose of the old material and its map if they exist
        if (activeLogo.material) {
          if (activeLogo.material.map) {
            activeLogo.material.map.dispose();
          }
          activeLogo.material.dispose(); // Dispose the material itself
        }

        const logoTexture = new THREE.CanvasTexture(logoCanvas);
        logoTexture.encoding = THREE.sRGBEncoding; // Consistent with text texture
        logoTexture.minFilter = THREE.LinearFilter;
        logoTexture.magFilter = THREE.LinearFilter;
        logoTexture.format = THREE.RGBAFormat; // Ensure alpha channel is preserved
        logoTexture.premultiplyAlpha = false; // Prevent alpha premultiplication issues

        // Fix rotation/flipping issues by adjusting texture coordinates
        logoTexture.flipY = false; // Prevent Y-axis flipping which is common in Three.js
        logoTexture.wrapS = THREE.ClampToEdgeWrapping;
        logoTexture.wrapT = THREE.ClampToEdgeWrapping;

        // If the logo still appears rotated, uncomment ONE of these lines to fix it:
        // logoTexture.rotation = Math.PI; // Rotate 180 degrees (upside down)
        // logoTexture.rotation = Math.PI / 2; // Rotate 90 degrees clockwise
        // logoTexture.rotation = -Math.PI / 2; // Rotate 90 degrees counter-clockwise
        // logoTexture.rotation = Math.PI * 1.5; // Rotate 270 degrees

        // Set rotation center to middle of texture (required for rotation to work properly)
        logoTexture.center.set(0.5, 0.5);

        logoTexture.needsUpdate = true; // Force texture update

        // Use MeshBasicMaterial for the logo to render it as a flat, unlit image
        activeLogo.material = new THREE.MeshBasicMaterial({
          map: logoTexture,
          color: 0xffffff,      // Ensure no tinting from material color
          transparent: true,    // Enable transparency
          depthWrite: false,    // Helps with rendering transparent textures
          alphaTest: 0.1        // Discard pixels with very low alpha
        });
        activeLogo.renderOrder = 999; // Force higher render order for transparency

        activeLogo.visible = true;

        if (activeLogo === cardMeshes.LogoCenter) {
          activeLogo.position.x = 0.035; // Adjust slightly to the right
        }
      };
      img.onerror = () => {
        console.error("Error loading image for logo texture:", activeState.logoUrl);
        // Dispose of the old material and its map if they exist
        if (activeLogo.material) {
          if (activeLogo.material.map) {
            activeLogo.material.map.dispose();
          }
          activeLogo.material.dispose();
        }
        // Optionally assign a default transparent material or just hide
        activeLogo.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
        activeLogo.visible = false;
      };
      // Set crossOrigin for images from other domains if needed, though object URLs don't require it.
      // if (!activeState.logoUrl.startsWith('blob:')) {
      //   img.crossOrigin = 'Anonymous'; 
      // }
      img.src = activeState.logoUrl; // Start loading the image

    } else { // No activeState.logoUrl
      // Dispose of the old material and its map if they exist
      if (activeLogo.material) {
        if (activeLogo.material.map) {
          activeLogo.material.map.dispose();
        }
        activeLogo.material.dispose();
      }
      // Optionally assign a default transparent material or just hide
      activeLogo.material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
      activeLogo.visible = false;
    }
  }
}

// Function to position the rotation cue
function positionRotationCue() {
  const canvas = document.getElementById('canvas');
  const rotationCue = document.getElementById('rotation-cue');
  const heroGrid = document.querySelector('.hero_grid');

  if (canvas && rotationCue && heroGrid) {
    const isSmallPortrait = window.innerWidth < 586 && !window.matchMedia("(orientation: landscape)").matches;

    if (isSmallPortrait) {
      // Use CSS-based centering for small portrait screens
      rotationCue.style.left = '50%';
      rotationCue.style.transform = 'translateX(-50%)';
    } else {
      // Use JS-based centering for larger screens or small landscape screens
      const canvasRect = canvas.getBoundingClientRect();
      const heroGridRect = heroGrid.getBoundingClientRect();

      // Calculate canvas center relative to hero_grid (since rotation cue is absolutely positioned relative to hero_grid)
      const canvasCenterX = canvasRect.left - heroGridRect.left + canvasRect.width / 2;
      const cueRect = rotationCue.getBoundingClientRect();
      const cueLeft = canvasCenterX - cueRect.width / 2;

      rotationCue.style.left = `${cueLeft}px`;
      rotationCue.style.transform = 'translateX(0%)'; // Clear any previous transform
    }
  }
}

// Debounce function to limit resize/orientationchange calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedPositionRotationCue = debounce(positionRotationCue, 50);

// Add event listeners only once
let listenersAdded = false;
function addPositioningListeners() {
  if (!listenersAdded) {
    window.addEventListener('resize', debouncedPositionRotationCue);
    window.addEventListener('orientationchange', debouncedPositionRotationCue);
    listenersAdded = true;
  }
}

// Simplified Event Listener Setup (Focus on critical state changes)
function setupBasicListeners() {

  const nameInput = document.querySelector('[data-name-input]');

  if (nameInput) nameInput.addEventListener('input', (e) => {
    window.cardState.name = e.target.value;
    updateCardModelFromState();
  });

  // Design selection listeners
  document.querySelectorAll('[data-design]').forEach(item => {
    item.addEventListener('click', function () {
      const design = this.getAttribute('data-design');
      window.cardState.customDesign = design;

      // Auto-switch logo position based on design
      if (design === 'duotone') {
        window.cardState.logoPosition = 'topright';
        // Update the radio button UI
        const topRightRadio = document.getElementById('logo-topright');
        if (topRightRadio) topRightRadio.checked = true;
      } else {
        window.cardState.logoPosition = 'center';
        // Update the radio button UI
        const centerRadio = document.getElementById('logo-center');
        if (centerRadio) centerRadio.checked = true;
      }

      updateCardModelFromState();
    });
  });

  // Gradient type selection listeners
  document.querySelectorAll('[data-gradient-type]').forEach(item => {
    item.addEventListener('click', function () {
      window.cardState.customGradientType = this.getAttribute('data-gradient-type');
      updateCardModelFromState();
    });
  });

  // Template selection listeners
  document.querySelectorAll('[data-template-option]').forEach(item => {
    item.addEventListener('click', function () {
      const templateId = this.getAttribute('data-template-option');
      window.cardState.selectedTemplateId = templateId;

      // Auto-switch logo position based on template design
      const template = templates[templateId];
      if (template && template.design === 'duotone') {
        window.cardState.logoPosition = 'topright';
        // Update the radio button UI
        const topRightRadio = document.getElementById('logo-topright');
        if (topRightRadio) topRightRadio.checked = true;
      } else {
        window.cardState.logoPosition = 'center';
        // Update the radio button UI
        const centerRadio = document.getElementById('logo-center');
        if (centerRadio) centerRadio.checked = true;
      }

      updateCardModelFromState();
    });
  });

  // Tab switching listeners
  document.querySelectorAll('[data-card-tab-link]').forEach(item => {
    item.addEventListener('click', function () {
      const tabType = this.getAttribute('data-card-tab-link');
      window.cardState.tab = tabType;
      updateCardModelFromState();
    });
  });

  // Logo position radio button listeners
  document.querySelectorAll('input[name="logo-position"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        window.cardState.logoPosition = e.target.value;
        updateCardModelFromState();
      }
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeLogoFromStorage();
    initThreeJS();
    setupBasicListeners();
    startSmoothProgress(); // Start the smooth progress animation
    // Don't hide loader here, loadingManager.onLoad will handle it
  });
} else {
  initializeLogoFromStorage();
  initThreeJS();
  setupBasicListeners();
  startSmoothProgress(); // Start the smooth progress animation
  // Don't hide loader here, loadingManager.onLoad will handle it
}



