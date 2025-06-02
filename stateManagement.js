// state management
document.addEventListener('DOMContentLoaded', function () {
  // 1. STATE OBJECTS
  window.cardState = {
    tab: 'customize', // 'customize' or 'templates'
    // Renaming properties for custom selections
    customDesign: 'classic',    // 'classic', 'duotone', 'gradient'
    classicColor: '#04091B',    // For 'classic' mode only
    customColorOne: '#FFB900',
    customColorTwo: '#111427',   // For 'duotone'
    customGradientType: 'radial', // 'linear' or 'radial'
    customGradientColorOne: '#667ED8',
    customGradientColorTwo: '#69F7DB',

    selectedTemplateId: '01', // e.g., '01', '02' - default to first template
    name: '', // Name remains shared and user-driven
    logoUrl: null,
    // For revoking object URLs
    _currentLogoObjectUrl: null
  };

  const templates = {
    '01': {
      design: 'classic',
      colorOne: '#0037FF',
      colorTwo: '#0037FF',
      gradientType: ' ',
      gradientColorOne: '#667ED8',
      gradientColorTwo: '#69F7DB',
      logoUrl: null
    },
    '02': {
      design: 'duotone',
      colorOne: '#F65555',
      colorTwo: '#FC8C8C',
      gradientType: ' ',
      gradientColorOne: '#667ED8',
      gradientColorTwo: '#69F7DB',
      logoUrl: null
    },
    '03': {
      design: 'gradient',
      gradientType: 'linear',
      gradientColorOne: '#F4A41B',
      gradientColorTwo: '#FA3D31',
      colorOne: '#FFB900',
      colorTwo: '#111427',
      logoUrl: null
    },
    '04': {
      design: 'gradient',
      gradientType: 'radial',
      gradientColorOne: '#B919BE',
      gradientColorTwo: '#1C0BB7',
      colorOne: '#FFB900',
      colorTwo: '#111427',
      logoUrl: null
    },
    '05': {
      design: 'duotone',
      colorOne: '#0037FF',
      colorTwo: '#FA3D31',
      gradientType: ' ',
      gradientColorOne: '#667ED8',
      gradientColorTwo: '#69F7DB',
      logoUrl: null
    },
    '06': {
      design: 'classic',
      colorOne: '#F65555',
      colorTwo: '#FC8C8C',
      gradientType: ' ',
      gradientColorOne: '#667ED8',
      gradientColorTwo: '#69F7DB',
      logoUrl: null
    },

  };

  window.selectedDesignName = '';
  window.selectedTemplateName = '';

  function setColorInputValue(inputElement, value) {
    if (inputElement) {
      inputElement.value = value;
      inputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      const wrapper = inputElement.closest('.color-picker-wrapper');
      if (wrapper) {
        const button = wrapper.querySelector('.color-button');
        if (button) button.style.backgroundColor = value;
      }
    }
  }

  function updateColorIndicators() {
    const colorIndicators = document.querySelector('.color-indicators');
    const firstIndicator = colorIndicators.querySelector('.color_indicator-item.first');
    const secondIndicator = colorIndicators.querySelector('.color_indicator-item:not(.first)');

    if (!window.cardState) return;

    // Hide both indicators by default
    firstIndicator.style.display = 'none';
    secondIndicator.style.display = 'none';

    if (window.cardState.customDesign === 'classic') {
      // Show only first indicator for classic design
      firstIndicator.style.display = 'block';
      firstIndicator.style.backgroundColor = window.cardState.classicColor;
      firstIndicator.style.marginRight = '0'; // Reset margin when only one is shown
    } else if (window.cardState.customDesign === 'duotone') {
      // Show both indicators for duotone design
      firstIndicator.style.display = 'block';
      secondIndicator.style.display = 'block';
      firstIndicator.style.backgroundColor = window.cardState.customColorOne;
      secondIndicator.style.backgroundColor = window.cardState.customColorTwo;
      firstIndicator.style.marginRight = '-4px'; // Overlap effect
    } else if (window.cardState.customDesign === 'gradient') {
      // Show both indicators for gradient design
      firstIndicator.style.display = 'block';
      secondIndicator.style.display = 'block';
      firstIndicator.style.backgroundColor = window.cardState.customGradientColorOne;
      secondIndicator.style.backgroundColor = window.cardState.customGradientColorTwo;
      firstIndicator.style.marginRight = '-4px'; // Overlap effect
    }
  }

  function reflectStateInCustomizeUI() {
    if (!window.cardState) return;

    document.querySelectorAll('[data-design]').forEach(item => {
      if (item.getAttribute('data-design') === window.cardState.customDesign) {
        item.classList.add('is-active');
        const nameElement = item.querySelector('div:not(.card_design-item)');
        window.selectedDesignName = nameElement ? nameElement.textContent.trim() : window.cardState.customDesign.charAt(0).toUpperCase() + window.cardState.customDesign.slice(1);
      } else {
        item.classList.remove('is-active');
      }
    });

    const classicColorInput = document.querySelector('[data-classic-option="solid-color"] .color-input');
    const duotoneColorOneInput = document.querySelector('[data-adjust-colors-wrapper="duotone"] [data-color-option="color-one"] .color-input');
    const duotoneColorTwoInput = document.querySelector('[data-adjust-colors-wrapper="duotone"] [data-color-option="color-two"] .color-input');
    const gradientColorOneInput = document.querySelector('[data-adjust-colors-wrapper="gradient"] [data-gradient-color="color-one"] .color-input');
    const gradientColorTwoInput = document.querySelector('[data-adjust-colors-wrapper="gradient"] [data-gradient-color="color-two"] .color-input');

    // Reflect custom colors
    setColorInputValue(classicColorInput, window.cardState.classicColor);
    setColorInputValue(duotoneColorOneInput, window.cardState.customColorOne);
    setColorInputValue(duotoneColorTwoInput, window.cardState.customColorTwo);
    setColorInputValue(gradientColorOneInput, window.cardState.customGradientColorOne);
    setColorInputValue(gradientColorTwoInput, window.cardState.customGradientColorTwo);

    document.querySelectorAll('[data-gradient-type]').forEach(item => {
      if (item.getAttribute('data-gradient-type') === window.cardState.customGradientType) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });

    const duotoneColorsWrapper = document.querySelector('[data-adjust-colors-wrapper="duotone"]');
    const gradientColorsWrapper = document.querySelector('[data-adjust-colors-wrapper="gradient"]');
    const classicColorsWrapper = document.querySelector('[data-adjust-colors-wrapper="classic"]');
    // Visibility based on customDesign
    if (duotoneColorsWrapper) duotoneColorsWrapper.style.display = (window.cardState.customDesign === 'duotone') ? '' : 'none';
    if (gradientColorsWrapper) gradientColorsWrapper.style.display = (window.cardState.customDesign === 'gradient') ? '' : 'none';
    if (classicColorsWrapper) classicColorsWrapper.style.display = (window.cardState.customDesign === 'classic') ? '' : 'none';

    const nameInputEl = document.getElementById('name-2');
    if (nameInputEl && nameInputEl.value !== window.cardState.name) {
      nameInputEl.value = window.cardState.name;
    }

    const imagePreview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const uploadWrapper = document.querySelector('.upload-wrapper');
    const logoUploadInput = document.getElementById('logo-upload');

    if (window.cardState.logoUrl) {
      if (imagePreview) imagePreview.src = window.cardState.logoUrl;
      if (previewContainer) previewContainer.style.display = 'block';
      if (uploadWrapper) uploadWrapper.style.display = 'none';
    } else {
      if (imagePreview) imagePreview.src = '#';
      if (previewContainer) previewContainer.style.display = 'none';
      if (uploadWrapper) uploadWrapper.style.display = 'block';
      if (logoUploadInput) logoUploadInput.value = '';
    }

    // Update design option tag based on current state
    updateDesignOptionTag();

    if (typeof window.updateStep1Header === 'function') window.updateStep1Header();

    // Update color indicators
    updateColorIndicators();
  }

  // Add dedicated function to update design option tag
  function updateDesignOptionTag() {
    const designOptionTagElement = document.getElementById('designOptionTag');
    if (!designOptionTagElement) return;

    // Always show and update the design option tag based on current state
    let displayText = '';

    if (window.selectedDesignName) {
      displayText = window.selectedDesignName;
    } else if (window.cardState && window.cardState.customDesign) {
      // Fallback to capitalize the design name from state
      displayText = window.cardState.customDesign.charAt(0).toUpperCase() + window.cardState.customDesign.slice(1);
    } else {
      displayText = 'Duotone'; // Default fallback
    }

    // Set the text content
    designOptionTagElement.textContent = displayText;
    designOptionTagElement.style.display = 'inline';
  }

  // Add dedicated function to update template option tag
  function updateTemplateOptionTag() {
    const templateOptionTagElement = document.getElementById('templateOptionTag');
    if (!templateOptionTagElement) return;

    // Update template option tag based on current state
    let displayText = '';

    // First try to get from selectedTemplateName
    if (window.selectedTemplateName) {
      displayText = window.selectedTemplateName;
    }
    // Then try to get from selectedTemplateId in state
    else if (window.cardState && window.cardState.selectedTemplateId) {
      // Try to get the template name from DOM
      const templateElement = document.querySelector(`[data-template-option="${window.cardState.selectedTemplateId}"]`);
      if (templateElement) {
        // Try to get text from the div that's not .card_design-item
        const nameElement = templateElement.querySelector('div:not(.card_design-item)');
        if (nameElement && nameElement.textContent.trim()) {
          displayText = nameElement.textContent.trim();
        } else {
          // Fallback to the attribute value itself
          displayText = window.cardState.selectedTemplateId;
        }
      } else {
        // Element not found, use the ID directly
        displayText = window.cardState.selectedTemplateId;
      }
    }
    // Try to find any active template element
    else {
      const activeTemplateElement = document.querySelector('[data-template-option].is-active');
      if (activeTemplateElement) {
        const templateId = activeTemplateElement.getAttribute('data-template-option');
        const nameElement = activeTemplateElement.querySelector('div:not(.card_design-item)');
        if (nameElement && nameElement.textContent.trim()) {
          displayText = nameElement.textContent.trim();
        } else {
          displayText = templateId;
        }
      } else {
        // Final fallback
        displayText = '01';
      }
    }

    // Set the text content
    templateOptionTagElement.textContent = displayText;
    templateOptionTagElement.style.display = 'inline';
  }

  // Expose the function globally
  window.updateDesignOptionTag = updateDesignOptionTag;
  window.updateTemplateOptionTag = updateTemplateOptionTag;
  window.reflectStateInCustomizeUI = reflectStateInCustomizeUI;

  function applyTemplateToState(templateId) {
    if (!window.cardState || !templates[templateId]) return;

    // const template = templates[templateId]; // No longer need to read full template data here
    // Only update selectedTemplateId, not custom design properties
    // window.cardState.design = template.design; // DO NOT DO THIS
    // window.cardState.colorOne = template.colorOne; // DO NOT DO THIS
    // window.cardState.colorTwo = template.colorTwo; // DO NOT DO THIS
    // window.cardState.gradientType = template.gradientType; // DO NOT DO THIS
    // window.cardState.gradientColorOne = template.gradientColorOne; // DO NOT DO THIS
    // window.cardState.gradientColorTwo = template.gradientColorTwo; // DO NOT DO THIS
    // window.cardState.name = template.name || ''; // Already removed

    // if (window.cardState._currentLogoObjectUrl) { // Logo is also independent unless template carries a specific logo
    //     URL.revokeObjectURL(window.cardState._currentLogoObjectUrl);
    //     window.cardState._currentLogoObjectUrl = null;
    // }
    // window.cardState.logoUrl = template.logoUrl || null; // Let's keep logo independent for now, template doesn't define it

    window.cardState.selectedTemplateId = templateId;

    // Try to get the template name from DOM first
    const templateOptionElement = document.querySelector(`[data-template-option="${templateId}"]`);
    if (templateOptionElement) {
      const nameElement = templateOptionElement.querySelector('div:not(.card_design-item)');
      if (nameElement && nameElement.textContent.trim()) {
        window.selectedTemplateName = nameElement.textContent.trim();
      } else {
        // Fallback to templateId if no text content found
        window.selectedTemplateName = templateId;
      }
    } else {
      // If element not found, use templateId
      window.selectedTemplateName = templateId;
    }

    // Update template option tag immediately
    updateTemplateOptionTag();

    // reflectStateInCustomizeUI(); // DO NOT CALL: Customize UI is independent
    if (typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
    // Note: updateCardModelFromState is now called with proper timing in tab switch logic
  }
  window.applyTemplateToState = applyTemplateToState;

  window.handleColorInputChange = function (inputElement) {
    const value = inputElement.value;
    const design = window.cardState.customDesign; // Use customDesign for logic

    const classicOption = inputElement.closest('[data-classic-option]');
    const duotoneColorWrapper = inputElement.closest('[data-adjust-colors-wrapper="duotone"]');
    const gradientColorOptionWrapper = inputElement.closest('[data-adjust-colors-wrapper="gradient"]');

    const colorOptionAttr = inputElement.closest('[data-color-option]')?.getAttribute('data-color-option') ||
      inputElement.closest('[data-gradient-color]')?.getAttribute('data-gradient-color');

    let stateChanged = false;
    if (design === 'classic' && classicOption) {
      if (window.cardState.classicColor !== value) { // Update classicColor
        window.cardState.classicColor = value;
        stateChanged = true;
      }
    } else if (design === 'duotone' && duotoneColorWrapper) {
      if (colorOptionAttr === 'color-one' && window.cardState.customColorOne !== value) { // Update customColorOne
        window.cardState.customColorOne = value;
        stateChanged = true;
      }
      if (colorOptionAttr === 'color-two' && window.cardState.customColorTwo !== value) { // Update customColorTwo
        window.cardState.customColorTwo = value;
        stateChanged = true;
      }
    } else if (design === 'gradient' && gradientColorOptionWrapper) {
      if (colorOptionAttr === 'color-one' && window.cardState.customGradientColorOne !== value) { // Update customGradientColorOne
        window.cardState.customGradientColorOne = value;
        stateChanged = true;
      }
      if (colorOptionAttr === 'color-two' && window.cardState.customGradientColorTwo !== value) { // Update customGradientColorTwo
        window.cardState.customGradientColorTwo = value;
        stateChanged = true;
      }
    }

    if (stateChanged) {
      // Update design option tag when colors change (since it shows current design state)
      if (typeof window.updateDesignOptionTag === 'function') {
        window.updateDesignOptionTag();
      }
    }
  }

  document.querySelectorAll('[data-design]').forEach(item => {
    item.addEventListener('click', function () {
      window.cardState.customDesign = this.getAttribute('data-design'); // Update customDesign
      // window.cardState.selectedTemplateId = null; // No longer nullifying template ID
      // window.selectedTemplateName = ''; // No longer clearing template name
      // if(typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header(); // No longer updating template header
      reflectStateInCustomizeUI();
      // Also update the design option tag immediately
      updateDesignOptionTag();
    });
  });

  document.querySelectorAll('[data-gradient-type]').forEach(item => {
    item.addEventListener('click', function () {
      window.cardState.customGradientType = this.getAttribute('data-gradient-type'); // Update customGradientType
      // window.cardState.selectedTemplateId = null; // No longer nullifying template ID
      // window.selectedTemplateName = '';
      // if(typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
      reflectStateInCustomizeUI();
    });
  });

  document.querySelectorAll('[data-template-option]').forEach(item => {
    item.addEventListener('click', function () {
      const templateId = this.getAttribute('data-template-option');
      applyTemplateToState(templateId);
      document.querySelectorAll('[data-template-option]').forEach(el => el.classList.remove('is-active'));
      this.classList.add('is-active');
      // Update the 3D card model with a slight delay to ensure UI state is set
      setTimeout(() => {
        if (typeof window.updateCardModelFromState === 'function') {
          window.updateCardModelFromState();
        }
      }, 50);
      // console.log for template selection is inside applyTemplateToState
    });
  });

  const nameInputEl = document.getElementById('name-2');
  if (nameInputEl) {
    nameInputEl.addEventListener('input', function (e) {
      window.cardState.name = e.target.value;
    });
  }

  const logoUploadInput = document.getElementById('logo-upload');
  if (logoUploadInput) {
    logoUploadInput.addEventListener('change', function (e) {
      if (window.cardState._currentLogoObjectUrl) {
        URL.revokeObjectURL(window.cardState._currentLogoObjectUrl);
        window.cardState._currentLogoObjectUrl = null;
      }
      if (this.files && this.files[0]) {
        const file = this.files[0];
        if (file.type.startsWith('image/')) {
          window.cardState._currentLogoObjectUrl = URL.createObjectURL(file);
          window.cardState.logoUrl = window.cardState._currentLogoObjectUrl;
        } else {
          window.cardState.logoUrl = null;
        }
      } else {
        window.cardState.logoUrl = null;
      }
    });
  }

  const removeLogoBtn = document.getElementById('remove-image');
  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', function () {
      if (window.cardState._currentLogoObjectUrl) {
        URL.revokeObjectURL(window.cardState._currentLogoObjectUrl);
        window.cardState._currentLogoObjectUrl = null;
      }
      window.cardState.logoUrl = null;
    });
  }

  const tabLinks = document.querySelectorAll('.card_tab-link');
  tabLinks.forEach(tab => {
    tab.addEventListener('click', function () {
      const tabType = this.getAttribute('data-card-tab-link');
      window.cardState.tab = tabType;

      if (tabType === 'customize') {
        reflectStateInCustomizeUI();
        // Existing accordion logic in other scripts should handle opening the correct customize step.
      } else if (tabType === 'templates') {
        if (!window.cardState.selectedTemplateId) {
          // If no template is selected, select the first one by default
          const firstTemplateOption = document.querySelector('[data-template-option]');
          if (firstTemplateOption) {
            const firstTemplateId = firstTemplateOption.getAttribute('data-template-option');
            applyTemplateToState(firstTemplateId); // This will set selectedTemplateId and reflect UI
            // Ensure the first template option is marked active visually by applyTemplateToState then reflectStateInCustomizeUI, and then the explicit set below
          } else {
            // No templates defined, clear selected name for header
            window.selectedTemplateName = '';
          }
        } else {
          // Ensure selectedTemplateName is set even if selectedTemplateId exists
          if (!window.selectedTemplateName) {
            const currentTemplateElement = document.querySelector(`[data-template-option="${window.cardState.selectedTemplateId}"]`);
            if (currentTemplateElement) {
              const nameElement = currentTemplateElement.querySelector('div:not(.card_design-item)');
              if (nameElement && nameElement.textContent.trim()) {
                window.selectedTemplateName = nameElement.textContent.trim();
              } else {
                window.selectedTemplateName = window.cardState.selectedTemplateId;
              }
            } else {
              window.selectedTemplateName = window.cardState.selectedTemplateId;
            }
          }
        }

        // Ensure the correct template option is marked active visually
        document.querySelectorAll('[data-template-option]').forEach(opt => opt.classList.remove('is-active'));
        if (window.cardState.selectedTemplateId) {
          const activeTemplateOption = document.querySelector(`[data-template-option="${window.cardState.selectedTemplateId}"]`);
          if (activeTemplateOption) {
            activeTemplateOption.classList.add('is-active');
            const nameElement = activeTemplateOption.querySelector('div:not(.card_design-item)');
            window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : window.cardState.selectedTemplateId;
          }
        } else {
          // Fallback if somehow selectedTemplateId is null but we are in templates tab (e.g. no templates defined)
          window.selectedTemplateName = '';
        }

        if (typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
        // Update the 3D card model to reflect the selected template with a slight delay
        // This ensures all UI state is properly set before updating the model
        setTimeout(() => {
          if (typeof window.updateCardModelFromState === 'function') {
            window.updateCardModelFromState();
          }
        }, 50);
        // Existing accordion logic should handle opening the correct template step.
      }

      // Update design option tag after tab change
      setTimeout(() => {
        if (typeof window.updateDesignOptionTag === 'function') {
          window.updateDesignOptionTag();
        }
      }, 100);

      // Update template option tag after tab change
      setTimeout(() => {
        if (typeof window.updateTemplateOptionTag === 'function') {
          window.updateTemplateOptionTag();
        }
      }, 100);
    });
  });

  // Initialize selectedDesignName based on initial customDesign state
  const initialDesignItem = document.querySelector(`[data-design="${window.cardState.customDesign}"]`);
  if (initialDesignItem) {
    const nameElement = initialDesignItem.querySelector('div:not(.card_design-item)');
    window.selectedDesignName = nameElement ? nameElement.textContent.trim() : window.cardState.customDesign.charAt(0).toUpperCase() + window.cardState.customDesign.slice(1);
    // Mark the initial design as active
    initialDesignItem.classList.add('is-active');
  } else {
    window.selectedDesignName = window.cardState.customDesign.charAt(0).toUpperCase() + window.cardState.customDesign.slice(1);
  }

  // Initialize selectedTemplateName based on initial selectedTemplateId state
  if (window.cardState.selectedTemplateId) {
    const initialTemplateItem = document.querySelector(`[data-template-option="${window.cardState.selectedTemplateId}"]`);
    if (initialTemplateItem) {
      const nameElement = initialTemplateItem.querySelector('div:not(.card_design-item)');
      window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : window.cardState.selectedTemplateId;
      // Mark the initial template as active
      initialTemplateItem.classList.add('is-active');
    } else {
      window.selectedTemplateName = window.cardState.selectedTemplateId;
    }
  } else {
    // Fallback: if no selectedTemplateId, try to find first template option
    const firstTemplateOption = document.querySelector('[data-template-option]');
    if (firstTemplateOption) {
      const firstTemplateId = firstTemplateOption.getAttribute('data-template-option');
      window.cardState.selectedTemplateId = firstTemplateId;
      const nameElement = firstTemplateOption.querySelector('div:not(.card_design-item)');
      window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : firstTemplateId;
      firstTemplateOption.classList.add('is-active');
    } else {
      window.selectedTemplateName = '01';
    }
  }

  reflectStateInCustomizeUI(); //This will ensure active classes and visibility are set from state.

  // Delay initial UI updates slightly to allow other scripts to potentially complete their DOM setup.
  if (typeof window.updateStep1Header === 'function') setTimeout(window.updateStep1Header, 50);
  if (typeof window.updateTemplateStep1Header === 'function') setTimeout(window.updateTemplateStep1Header, 50);

  // Ensure design option tag is updated on initial load
  setTimeout(() => {
    if (typeof window.updateDesignOptionTag === 'function') {
      window.updateDesignOptionTag();
    }
  }, 100);

  // Ensure template option tag is updated on initial load
  setTimeout(() => {
    if (typeof window.updateTemplateOptionTag === 'function') {
      window.updateTemplateOptionTag();
    }
  }, 100);

  // Initial update of color indicators
  if (typeof window.updateColorIndicators === 'undefined') {
    window.updateColorIndicators = updateColorIndicators;
  }
  setTimeout(updateColorIndicators, 50);
});
