// Initialize Coloris
Coloris({
  alpha: false,
  formatToggle: false,
  themeMode: 'dark',
  margin: 4,
  swatches: [
    '#FFB900',
    '#111427',

    '#ff0e52',
    '#C6FD4E',
    '#0c0d0d',
    '#ff5b19'
  ]
});

document.querySelectorAll('.color-picker-wrapper').forEach(wrapper => {
  const input = wrapper.querySelector('.color-input');
  const button = wrapper.querySelector('.color-button');
  button.style.backgroundColor = input.value;
  button.addEventListener('click', () => input.click());
  input.addEventListener('input', () => {
    button.style.backgroundColor = input.value;
    // Update the cardState based on which color picker was changed
    updateCardStateFromColorInput(input);
    // Update the color indicators
    if (window.updateColorIndicators) window.updateColorIndicators();
    // Update the 3D model
    if (window.updateCardModelFromState) window.updateCardModelFromState();
  });
});

// Function to update cardState based on color input changes
function updateCardStateFromColorInput(inputElement) {
  if (!window.cardState) return;

  const value = inputElement.value;

  // Determine which color property to update based on the input's context
  const classicOption = inputElement.closest('[data-classic-option="solid-color"]');
  const duotoneColorOne = inputElement.closest('[data-color-option="color-one"]');
  const duotoneColorTwo = inputElement.closest('[data-color-option="color-two"]');
  const gradientColorOne = inputElement.closest('[data-gradient-color="color-one"]');
  const gradientColorTwo = inputElement.closest('[data-gradient-color="color-two"]');

  if (classicOption) {
    // Classic solid color
    window.cardState.classicColor = value;
  } else if (duotoneColorOne) {
    // Duotone color one
    window.cardState.customColorOne = value;
  } else if (duotoneColorTwo) {
    // Duotone color two
    window.cardState.customColorTwo = value;
  } else if (gradientColorOne) {
    // Gradient color one
    window.cardState.customGradientColorOne = value;
  } else if (gradientColorTwo) {
    // Gradient color two
    window.cardState.customGradientColorTwo = value;
  }

 
}
