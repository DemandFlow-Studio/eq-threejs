// STATE MANAGEMENT
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

    selectedTemplateId: null, // e.g., '01', '02'
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

    if (typeof window.updateColorIndicators === 'function') window.updateColorIndicators();
    if (typeof window.updateStep1Header === 'function') window.updateStep1Header();
  }
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

    const templateOptionElement = document.querySelector(`[data-template-option="${templateId}"]`);
    if (templateOptionElement) {
      const nameElement = templateOptionElement.querySelector('div:not(.card_design-item)');
      window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : templateId;
    } else {
      window.selectedTemplateName = templateId;
    }

    // reflectStateInCustomizeUI(); // DO NOT CALL: Customize UI is independent
    if (typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
    console.log("Card state updated (applyTemplateToState - selectedTemplateId only):", JSON.parse(JSON.stringify(window.cardState)));
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

    if (typeof window.updateColorIndicators === 'function') window.updateColorIndicators();
    if (stateChanged) {
      console.log("Card state updated (handleColorInputChange):", JSON.parse(JSON.stringify(window.cardState)));
    }
  }

  if (typeof window.updateColorIndicators === 'function') {
    window.updateColorIndicators = function () { // Fully redefine, integrating cardState
      const colorIndicatorsEl = document.getElementById('colorIndicators');
      const colorOneIndicator = document.getElementById('colorOne');
      const colorTwoIndicator = document.getElementById('colorTwo');
      if (!colorIndicatorsEl || !colorOneIndicator || !colorTwoIndicator) return;

      // Indicators should reflect the custom design settings when in customize tab context
      colorOneIndicator.style.backgroundColor = window.cardState.customDesign === 'gradient' ? window.cardState.customGradientColorOne : (window.cardState.customDesign === 'classic' ? window.cardState.classicColor : window.cardState.customColorOne);
      colorOneIndicator.style.display = 'inline-block';

      if (window.cardState.customDesign === 'duotone') {
        colorTwoIndicator.style.backgroundColor = window.cardState.customColorTwo;
        colorTwoIndicator.style.display = 'inline-block';
      } else if (window.cardState.customDesign === 'gradient') {
        colorTwoIndicator.style.backgroundColor = window.cardState.customGradientColorTwo;
        colorTwoIndicator.style.display = 'inline-block';
      } else {
        colorTwoIndicator.style.display = 'none';
      }

      const step2Accordion = document.querySelector('[data-controls-step="2"].control_accordian'); // Ensure it's the customize tab one
      if (step2Accordion) {
        const step2Content = step2Accordion.querySelector('.c_accordian-content');
        if (step2Content && step2Content.style.height === '0px') {
          colorIndicatorsEl.style.display = 'flex';
        } else {
          colorIndicatorsEl.style.display = 'none';
        }
      } else {
        colorIndicatorsEl.style.display = 'none'; // Default if not found
      }
    };
  }

  document.querySelectorAll('[data-design]').forEach(item => {
    item.addEventListener('click', function () {
      window.cardState.customDesign = this.getAttribute('data-design'); // Update customDesign
      // window.cardState.selectedTemplateId = null; // No longer nullifying template ID
      // window.selectedTemplateName = ''; // No longer clearing template name
      // if(typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header(); // No longer updating template header
      reflectStateInCustomizeUI();
      console.log("Card state updated (customDesign change):", JSON.parse(JSON.stringify(window.cardState)));
    });
  });

  document.querySelectorAll('[data-gradient-type]').forEach(item => {
    item.addEventListener('click', function () {
      window.cardState.customGradientType = this.getAttribute('data-gradient-type'); // Update customGradientType
      // window.cardState.selectedTemplateId = null; // No longer nullifying template ID
      // window.selectedTemplateName = '';
      // if(typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
      reflectStateInCustomizeUI();
      console.log("Card state updated (customGradientType change):", JSON.parse(JSON.stringify(window.cardState)));
    });
  });

  document.querySelectorAll('[data-template-option]').forEach(item => {
    item.addEventListener('click', function () {
      const templateId = this.getAttribute('data-template-option');
      applyTemplateToState(templateId);
      document.querySelectorAll('[data-template-option]').forEach(el => el.classList.remove('is-active'));
      this.classList.add('is-active');
      // console.log for template selection is inside applyTemplateToState
    });
  });

  const nameInputEl = document.getElementById('name-2');
  if (nameInputEl) {
    nameInputEl.addEventListener('input', function (e) {
      window.cardState.name = e.target.value;
      window.cardState.selectedTemplateId = null;
      window.selectedTemplateName = '';
      if (typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
      console.log("Card state updated (name input):", JSON.parse(JSON.stringify(window.cardState)));
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
          window.cardState.selectedTemplateId = null;
          window.selectedTemplateName = '';
          if (typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
          reflectStateInCustomizeUI();
          console.log("Card state updated (logo upload):", JSON.parse(JSON.stringify(window.cardState)));
        } else {
          window.cardState.logoUrl = null;
          reflectStateInCustomizeUI();
          console.log("Card state updated (logo upload invalid file):", JSON.parse(JSON.stringify(window.cardState)));
        }
      } else {
        window.cardState.logoUrl = null;
        reflectStateInCustomizeUI();
        console.log("Card state updated (logo upload no file):", JSON.parse(JSON.stringify(window.cardState)));
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
      window.cardState.selectedTemplateId = null;
      window.selectedTemplateName = '';
      if (typeof window.updateTemplateStep1Header === 'function') window.updateTemplateStep1Header();
      reflectStateInCustomizeUI();
      console.log("Card state updated (logo removal):", JSON.parse(JSON.stringify(window.cardState)));
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
        // Existing accordion logic should handle opening the correct template step.
      }
      console.log("Card state updated (tab switch):", JSON.parse(JSON.stringify(window.cardState)));
    });
  });

  const initialDesignItem = document.querySelector(`[data-design="${window.cardState.customDesign}"]`);
  if (initialDesignItem) {
    const nameElement = initialDesignItem.querySelector('div:not(.card_design-item)');
    window.selectedDesignName = nameElement ? nameElement.textContent.trim() : window.cardState.customDesign.charAt(0).toUpperCase() + window.cardState.customDesign.slice(1);
  } else {
    window.selectedDesignName = window.cardState.customDesign.charAt(0).toUpperCase() + window.cardState.customDesign.slice(1);
  }

  if (window.cardState.selectedTemplateId) {
    const initialTemplateItem = document.querySelector(`[data-template-option="${window.cardState.selectedTemplateId}"]`);
    if (initialTemplateItem) {
      const nameElement = initialTemplateItem.querySelector('div:not(.card_design-item)');
      window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : window.cardState.selectedTemplateId;
    }
  } else {
    if (!window.selectedTemplateName && document.querySelector('[data-template-option="01"]')) {
      const firstTemplateOption = document.querySelector('[data-template-option="01"]');
      const nameElement = firstTemplateOption.querySelector('div:not(.card_design-item)');
      window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : '01';
    }
  }

  reflectStateInCustomizeUI(); //This will ensure active classes and visibility are set from state.

  // Delay initial UI updates slightly to allow other scripts to potentially complete their DOM setup.
  if (typeof window.updateStep1Header === 'function') setTimeout(window.updateStep1Header, 50);
  if (typeof window.updateColorIndicators === 'function') setTimeout(window.updateColorIndicators, 50);
  if (typeof window.updateTemplateStep1Header === 'function') setTimeout(window.updateTemplateStep1Header, 50);

  console.log("Card state management initialized. Initial state:", JSON.parse(JSON.stringify(window.cardState)));
});
