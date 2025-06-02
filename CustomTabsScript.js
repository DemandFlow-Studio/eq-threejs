// Multi-step functionality for card customization
document.addEventListener('DOMContentLoaded', function () {
  // Track the current step
  let currentStep = 1;
  const totalSteps = 3;

  // Elements
  const accordionItems = document.querySelectorAll('[data-controls-step]');
  const nextBtn = document.querySelector('[data-control-btn="next"]');
  const backBtn = document.querySelector('[data-control-btn="back"]');
  const designOptionTagElement = document.getElementById('designOptionTag');
  window.selectedDesignName = '';

  // Function to download canvas as image
  function downloadCanvasPreview() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
      console.error('Canvas not found');
      alert('Canvas not found. Please ensure the 3D model is loaded.');
      return;
    }

    try {
      // Get current card state for filename
      const cardName = window.cardState?.name?.trim() || 'card';
      const today = new Date();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[today.getMonth()];
      const day = String(today.getDate()).padStart(2, '0');
      const readableDate = `${month}${day}`; // e.g., Jun12
      const filename = `${cardName.replace(/[^a-z0-9]/gi, '_')}-${readableDate}.png`;

      // Access Three.js components
      const renderer = window.renderer;
      const scene = window.scene;
      const camera = window.camera;
      const controls = window.orbitControls;

      if (!renderer || !scene || !camera) {
        console.error('Three.js components not found');
        alert('3D scene not properly loaded. Please wait for the model to load completely.');
        return;
      }

      // Check if GSAP is available for smooth animation
      if (!window.gsap) {
        console.error('GSAP not found');
        alert('Animation library not loaded. Please refresh the page.');
        return;
      }

      // Store original camera and controls state
      const originalCameraState = {
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
        quaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w }
      };

      const originalControlsState = controls ? {
        target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
        autoRotate: controls.autoRotate
      } : null;

      // Pause floating animations during the transition
      const wasAnimating = window.floatingAnimations && !window.floatingAnimations.paused();
      if (wasAnimating) {
        window.floatingAnimations.pause();
      }

      // Disable auto-rotate if it's enabled
      if (controls) {
        controls.autoRotate = false;
      }

      // Perfect front view position and rotation
      // Calculate the current distance from the model to maintain zoom level
      const currentDistance = camera.position.distanceTo(scene.position);
      const targetPosition = { x: 0, y: 0, z: currentDistance }; // Use current distance instead of fixed z: 6
      const targetRotation = { x: 0, y: 0, z: 0 };
      const targetQuaternion = { x: 0, y: 0, z: 0, w: 1 }; // Identity quaternion
      const targetControlsTarget = { x: 0, y: 0, z: 0 };

      // Create smooth animation timeline
      const downloadTl = gsap.timeline({
        onComplete: () => {
          // Capture the image after animation completes
          performCapture();
        }
      });

      // Animate camera position
      downloadTl.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: "power2.inOut"
      }, 0);

      // Animate camera rotation
      downloadTl.to(camera.rotation, {
        x: targetRotation.x,
        y: targetRotation.y,
        z: targetRotation.z,
        duration: 1.5,
        ease: "power2.inOut"
      }, 0);

      // Animate camera quaternion for perfect alignment
      downloadTl.to(camera.quaternion, {
        x: targetQuaternion.x,
        y: targetQuaternion.y,
        z: targetQuaternion.z,
        w: targetQuaternion.w,
        duration: 1.5,
        ease: "power2.inOut"
      }, 0);

      // Animate controls target if controls exist
      if (controls) {
        downloadTl.to(controls.target, {
          x: targetControlsTarget.x,
          y: targetControlsTarget.y,
          z: targetControlsTarget.z,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            controls.update();
          }
        }, 0);
      }

      // Function to perform the actual capture
      function performCapture() {
        // Ensure perfect camera alignment before capture, but maintain current distance
        camera.position.set(0, 0, currentDistance); // Use currentDistance instead of hardcoded 6
        camera.rotation.set(0, 0, 0);
        camera.quaternion.set(0, 0, 0, 1);
        camera.up.set(0, 1, 0); // Ensure up vector is correct
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        // Update controls to match camera
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }

        // Force render with perfect position
        renderer.render(scene, camera);

        // Method 1: Try using canvas.toBlob directly
        const tryDirectCapture = () => {
          return new Promise((resolve, reject) => {
            try {
              setTimeout(() => {
                canvas.toBlob((blob) => {
                  if (blob && blob.size > 0) {
                    resolve(blob);
                  } else {
                    console.warn('Direct capture produced empty or invalid blob');
                    reject(new Error('Canvas produced empty blob'));
                  }
                }, 'image/png', 0.95);
              }, 100);
            } catch (error) {
              console.error('Direct capture failed:', error);
              reject(error);
            }
          });
        };

        // Method 2: Fallback using temporary canvas
        const tryFallbackCapture = () => {
          return new Promise((resolve, reject) => {
            try {
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d');

              tempCanvas.width = canvas.width || 1200;
              tempCanvas.height = canvas.height || 900;

              // Fill with white background
              tempCtx.fillStyle = '#ffffff';
              tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

              try {
                tempCtx.drawImage(canvas, 0, 0);
              } catch (drawError) {
                console.warn('Could not draw WebGL canvas, creating placeholder:', drawError);
                tempCtx.fillStyle = '#f0f0f0';
                tempCtx.fillRect(50, 50, tempCanvas.width - 100, tempCanvas.height - 100);
                tempCtx.fillStyle = '#666';
                tempCtx.font = '32px Arial';
                tempCtx.textAlign = 'center';
                tempCtx.fillText('3D Card Preview', tempCanvas.width / 2, tempCanvas.height / 2 - 20);
                tempCtx.font = '18px Arial';
                tempCtx.fillText('Card Name: ' + cardName, tempCanvas.width / 2, tempCanvas.height / 2 + 20);
              }

              tempCanvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  console.error('Fallback canvas produced empty blob');
                  reject(new Error('Fallback canvas produced empty blob'));
                }
              }, 'image/png', 0.95);
            } catch (error) {
              console.error('Fallback capture failed:', error);
              reject(error);
            }
          });
        };

        // Download function
        const downloadBlob = (blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => URL.revokeObjectURL(url), 1000);

          // Restore original camera position and settings after download
          setTimeout(() => {
            // Create restoration timeline
            const restoreTl = gsap.timeline({
              onComplete: () => {
                // Re-enable animations if they were running
                if (wasAnimating && window.floatingAnimations) {
                  window.floatingAnimations.resume();
                }

                // Restore original auto-rotate setting
                if (controls && originalControlsState) {
                  controls.autoRotate = originalControlsState.autoRotate;
                }
              }
            });

            // Animate back to original camera position
            restoreTl.to(camera.position, {
              x: originalCameraState.position.x,
              y: originalCameraState.position.y,
              z: originalCameraState.position.z,
              duration: 1.5,
              ease: "power2.inOut"
            }, 0);

            // Animate back to original camera rotation
            restoreTl.to(camera.rotation, {
              x: originalCameraState.rotation.x,
              y: originalCameraState.rotation.y,
              z: originalCameraState.rotation.z,
              duration: 1.5,
              ease: "power2.inOut"
            }, 0);

            // Animate back to original camera quaternion
            restoreTl.to(camera.quaternion, {
              x: originalCameraState.quaternion.x,
              y: originalCameraState.quaternion.y,
              z: originalCameraState.quaternion.z,
              w: originalCameraState.quaternion.w,
              duration: 1.5,
              ease: "power2.inOut"
            }, 0);

            // Animate back to original controls target if controls exist
            if (controls && originalControlsState) {
              restoreTl.to(controls.target, {
                x: originalControlsState.target.x,
                y: originalControlsState.target.y,
                z: originalControlsState.target.z,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => {
                  controls.update();
                }
              }, 0);
            }
          }, 500); // Small delay to ensure download has started
        };

        // Try capture methods
        tryDirectCapture()
          .then(downloadBlob)
          .catch((error) => {
            console.warn('Direct capture failed, trying fallback:', error);
            return tryFallbackCapture().then(downloadBlob);
          })
          .catch((error) => {
            console.error('All capture methods failed:', error);
            alert('Failed to download preview. Please try again.');
          });
      }

    } catch (error) {
      console.error('Error in downloadCanvasPreview:', error);
      alert('Failed to download preview. Please try again.');
    }
  }

  // Expose download function globally
  window.downloadCanvasPreview = downloadCanvasPreview;

  // Function to update the header of Step 1
  window.updateStep1Header = function () {
    if (!accordionItems || accordionItems.length === 0 || !designOptionTagElement) {
      return; // Safety check
    }

    // Always show the design option tag and sync with current state
    if (window.updateDesignOptionTag) {
      window.updateDesignOptionTag();
    } else {
      // Fallback if updateDesignOptionTag is not available yet
      if (window.selectedDesignName) {
        designOptionTagElement.textContent = window.selectedDesignName;
        designOptionTagElement.style.display = 'inline';
      }
    }
  }

  // Add transition style to all accordion contents
  accordionItems.forEach(item => {
    const contentEl = item.querySelector('.c_accordian-content');
    contentEl.style.transition = 'height 0.6s ease-in-out';
    contentEl.style.overflow = 'hidden';
    contentEl.style.height = '0px'; // Start closed
  });

  // Function to open a specific step and close others
  function openStep(stepNumber) {
    // Close all accordions first
    accordionItems.forEach(item => {
      const step = parseInt(item.getAttribute('data-controls-step'));
      const contentEl = item.querySelector('.c_accordian-content');
      const toggleEl = item.querySelector('.c_accordian-link');

      if (step === stepNumber) {
        // Open this step
        // First set height to auto temporarily to get the scrollHeight
        contentEl.style.height = 'auto';
        const actualHeight = contentEl.scrollHeight;
        // Set back to 0 and force a reflow
        contentEl.style.height = '0px';
        // Force a reflow
        contentEl.offsetHeight;
        // Now animate to the actual height
        contentEl.style.height = actualHeight + 'px';

        toggleEl.style.opacity = '1';
        currentStep = stepNumber;
      } else {
        // Close other steps
        contentEl.style.height = '0px';
        toggleEl.style.opacity = '0.6';
      }
      // Update Step 1 header after any accordion state change
      window.updateStep1Header();
    });

    // Update button states
    updateButtonStates();
  }

  // Update Next/Back button states
  function updateButtonStates() {
    backBtn.style.opacity = currentStep > 1 ? '1' : '0.5';
    backBtn.style.pointerEvents = currentStep > 1 ? 'auto' : 'none';

    nextBtn.textContent = currentStep === totalSteps ? 'Download card' : 'Next';
  }

  // Add click handlers to accordion toggles
  accordionItems.forEach(item => {
    const toggleEl = item.querySelector('.c_accordian-link');
    const contentEl = item.querySelector('.c_accordian-content');
    const step = parseInt(item.getAttribute('data-controls-step'));

    toggleEl.addEventListener('click', function (e) {
      // If clicking on the currently open step, toggle it
      if (currentStep === step) {
        // If it's already open, close it
        if (contentEl.style.height !== '0px') {
          contentEl.style.height = '0px';
          toggleEl.style.opacity = '0.6';
        } else {
          // If it's closed, open it
          // First set height to auto temporarily to get the scrollHeight
          contentEl.style.height = 'auto';
          const actualHeight = contentEl.scrollHeight;
          // Set back to 0 and force a reflow
          contentEl.style.height = '0px';
          // Force a reflow
          contentEl.offsetHeight;
          // Now animate to the actual height
          contentEl.style.height = actualHeight + 'px';

          toggleEl.style.opacity = '1';
        }
      } else {
        // Otherwise, open this step and close others
        openStep(step);
      }
      // Update Step 1 header after user interaction with accordion
      window.updateStep1Header();
      e.stopPropagation(); // Prevent Webflow's built-in toggle
    });
  });

  // Wait a little before initializing to ensure DOM is fully loaded
  setTimeout(() => {
    // Initialize: Open first step, close others
    openStep(1);
    // Update headers on initial load
    window.updateStep1Header();
  }, 100);
});




// Custom tab system to replace Webflow tabs
document.addEventListener('DOMContentLoaded', function () {
  // Modify the tab structure for custom tabs
  const tabContainer = document.querySelector('.card_tab-menu');
  const tabLinks = document.querySelectorAll('.card_tab-link');
  const activeMask = tabContainer ? tabContainer.querySelector('.active-mask') : null;
  let currentTemplateStep = 1; // Track the currently open template step
  let currentCustomizeStep = 1; // Track the currently open customize step

  function updateActiveMaskPosition(activeTabElement) {
    if (activeMask && activeTabElement) {
      activeMask.style.left = `${activeTabElement.offsetLeft - 0.5}px`;
      activeMask.style.width = `${activeTabElement.offsetWidth + 2}px`;
    }
  }

  if (tabContainer && tabLinks.length > 0) {
    // Convert existing tabs to custom tabs
    tabLinks.forEach(link => {
      // Store the tab ID
      const tabId = link.getAttribute('data-w-tab');

      // Create new data attribute based on tab ID
      if (tabId === 'Tab 1') {
        link.setAttribute('data-card-tab-link', 'customize');
      } else if (tabId === 'Tab 2') {
        link.setAttribute('data-card-tab-link', 'templates');
      }

      // Remove Webflow-specific attributes and classes
      link.removeAttribute('data-w-tab');
      link.classList.remove('w-tab-link', 'w--current');
    });

    // Set the first tab as active by default
    const firstTab = tabLinks[0];
    if (firstTab) {
      firstTab.classList.add('is-active');
      if (activeMask && firstTab) { // Call the update function
        updateActiveMaskPosition(firstTab);
      }
    }

    // Get content panes
    const customizePane = document.querySelector('[data-card-tab-pane="customize"], [data-w-tab="Tab 1"]');
    const templatesPane = document.querySelector('[data-card-tab-pane="templates"], [data-w-tab="Tab 2"]');

    if (customizePane && templatesPane) {
      // Remove Webflow-specific classes if they weren't removed by previous script
      customizePane.classList.remove('w-tab-pane', 'w--tab-active');
      templatesPane.classList.remove('w-tab-pane');

      // Add custom classes/attributes if not already present
      if (!customizePane.hasAttribute('data-card-tab-pane')) {
        customizePane.setAttribute('data-card-tab-pane', 'customize');
      }
      if (!templatesPane.hasAttribute('data-card-tab-pane')) {
        templatesPane.setAttribute('data-card-tab-pane', 'templates');
      }

      // Initially hide the templates pane
      templatesPane.style.display = 'none';
    }

    // Add click event listeners to the tabs
    tabLinks.forEach(tab => {
      tab.addEventListener('click', function (e) {
        e.preventDefault();

        // Get the tab type (customize or templates)
        const tabType = this.getAttribute('data-card-tab-link');

        // Update active tab styling
        tabLinks.forEach(t => t.classList.remove('is-active'));
        this.classList.add('is-active');
        if (activeMask) { // Call the update function
          updateActiveMaskPosition(this);
        }

        // Show/hide appropriate content
        if (tabType === 'customize') {
          if (customizePane) customizePane.style.display = 'block';
          if (templatesPane) templatesPane.style.display = 'none';
          toggleControlSteps(true);
          // Open the first customize step by default when switching to customize tab
          openCustomizeStep(1);
        } else if (tabType === 'templates') {
          if (customizePane) customizePane.style.display = 'none';
          if (templatesPane) templatesPane.style.display = 'block';
          toggleControlSteps(false);
          // Open the first template step by default when switching to templates tab
          openTemplateStep(1);
          // Call template header update if available
          if (typeof window.updateTemplateStep1Header === 'function') {
            setTimeout(window.updateTemplateStep1Header, 100);
          }
        }

        moveForm(tabType);
      });
    });

    // Function to toggle visibility of control steps based on active tab
    function toggleControlSteps(isCustomizeTab) {
      const controlSteps = document.querySelectorAll('[data-controls-step]');
      const templateSteps = document.querySelectorAll('[data-template-controls-step]');
      const dualSteps = document.querySelectorAll('[data-controls-step][data-template-controls-step]');

      controlSteps.forEach(step => {
        if (!step.hasAttribute('data-template-controls-step')) {
          step.style.display = isCustomizeTab ? '' : 'none';
        }
      });

      templateSteps.forEach(step => {
        if (!step.hasAttribute('data-controls-step')) {
          step.style.display = isCustomizeTab ? 'none' : '';
        }
      });

      dualSteps.forEach(step => {
        step.style.display = ''; // Always show dual attribute steps, their content will be managed by accordion logic
        if (isCustomizeTab) {
          step.classList.add('is-customize-step');
          step.classList.remove('is-template-step');
        } else {
          step.classList.add('is-template-step');
          step.classList.remove('is-customize-step');
        }
      });

      updateStepCountNumbers();
    }

    function updateStepCountNumbers() {
      const stepCountElements = document.querySelectorAll('.control-count'); // Changed selector to target the number itself

      stepCountElements.forEach(element => {
        const parentAccordion = element.closest('[data-controls-step], [data-template-controls-step]');

        if (parentAccordion) {
          let stepValue;
          const isActiveCustomize = document.querySelector('[data-card-tab-link="customize"].is-active');

          if (parentAccordion.hasAttribute('data-template-controls-step') && !isActiveCustomize) {
            stepValue = parentAccordion.getAttribute('data-template-controls-step');
          } else if (parentAccordion.hasAttribute('data-controls-step') && isActiveCustomize) {
            stepValue = parentAccordion.getAttribute('data-controls-step');
          } else if (parentAccordion.hasAttribute('data-template-controls-step')) { // Fallback for template if customize is not active
            stepValue = parentAccordion.getAttribute('data-template-controls-step');
          } else {
            stepValue = parentAccordion.getAttribute('data-controls-step'); // Default to control step
          }

          if (stepValue) {
            element.textContent = stepValue;
          }
        }
      });
    }

    function moveForm(tabType) {
      const formElement = document.querySelector('[data-card-info="form"]');
      const pasteHereElement = document.querySelector('[data-card-info="paste-here"]');
      const originalFormParent = document.querySelector('.card_control-tab-pane[data-card-tab-pane="customize"] [data-controls-step="3"] .c_accordian-content');

      if (formElement && pasteHereElement && originalFormParent) {
        if (tabType === 'templates') {
          pasteHereElement.appendChild(formElement);
        } else {
          originalFormParent.appendChild(formElement);
        }
      }
    }

    // Accordion functionality for customize steps
    const customizeAccordionItems = document.querySelectorAll('[data-controls-step]');

    customizeAccordionItems.forEach(item => {
      const toggleEl = item.querySelector('.c_accordian-link');
      const contentEl = item.querySelector('.c_accordian-content');
      const step = parseInt(item.getAttribute('data-controls-step'));

      if (toggleEl && contentEl) {
        // Add transition styles for smooth animations
        contentEl.style.transition = 'height 0.6s ease-in-out';
        contentEl.style.overflow = 'hidden';


        // Initialize all customize accordions to be closed except the first one
        if (step !== 1) {
          contentEl.style.height = '0px';
          toggleEl.style.opacity = '0.6';
        } else {
          contentEl.style.height = 'auto';
          contentEl.classList.remove('is-active');
          const actualHeight = contentEl.scrollHeight;
          contentEl.style.height = actualHeight + 'px';
          toggleEl.style.opacity = '1';
        }

        toggleEl.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation(); // Prevent any other click listeners

          const isActiveTemplateTab = document.querySelector('[data-card-tab-link="templates"].is-active');
          if (isActiveTemplateTab) return; // Do nothing if templates tab is active

          if (currentCustomizeStep === step && contentEl.style.height !== '0px') {
            // If clicking the currently open step, close it
            contentEl.style.height = '0px';
            toggleEl.style.opacity = '0.6';
            contentEl.classList.remove('opened');
          } else {
            // If clicking a new step or a closed step, open it and close others
            openCustomizeStep(step);
          }
        });
      }
    });

    function openCustomizeStep(stepNumber) {
      customizeAccordionItems.forEach(item => {
        const step = parseInt(item.getAttribute('data-controls-step'));
        const contentEl = item.querySelector('.c_accordian-content');
        const toggleEl = item.querySelector('.c_accordian-link');

        if (!contentEl || !toggleEl) return;

        if (step === stepNumber) {
          // Open this step
          contentEl.classList.add('opened');
          contentEl.style.height = 'auto'; // Get natural height
          const actualHeight = contentEl.scrollHeight;
          contentEl.style.height = '0px'; // Reset for animation
          contentEl.offsetHeight; // Force reflow
          contentEl.style.height = actualHeight + 'px';
          toggleEl.style.opacity = '1';
          currentCustomizeStep = stepNumber;

          // Update the Step 1 header if we're not opening step 1
          if (window.updateStep1Header && step !== 1) {
            window.updateStep1Header();
          }
        } else {
          // Close other steps
          contentEl.style.height = '0px';
          toggleEl.style.opacity = '0.6';
          contentEl.classList.remove('opened');
        }
      });

      // Handle Next/Back button states
      updateButtonStates();
    }

    // Handle Next/Back button states
    function updateButtonStates() {
      const nextBtn = document.querySelector('[data-control-btn="next"]');
      const backBtn = document.querySelector('[data-control-btn="back"]');
      const isActiveCustomizeTab = document.querySelector('[data-card-tab-link="customize"].is-active');

      if (nextBtn && backBtn) {
        let currentStep, totalSteps;
        if (isActiveCustomizeTab) {
          currentStep = currentCustomizeStep;
          totalSteps = customizeAccordionItems.length;
        } else {
          currentStep = currentTemplateStep;
          // Ensure templateAccordionItems is defined and populated correctly
          // It should be populated where it's declared: const templateAccordionItems = document.querySelectorAll('[data-template-controls-step]');
          totalSteps = templateAccordionItems.length;
        }

        backBtn.style.opacity = currentStep > 1 ? '1' : '0.5';
        backBtn.style.pointerEvents = currentStep > 1 ? 'auto' : 'none';

        nextBtn.textContent = currentStep === totalSteps ? 'Download card' : 'Next';
      }
    }

    // Accordion functionality for template steps
    const templateAccordionItems = document.querySelectorAll('[data-template-controls-step]');

    templateAccordionItems.forEach(item => {
      const toggleEl = item.querySelector('.c_accordian-link');
      const contentEl = item.querySelector('.c_accordian-content');
      const step = parseInt(item.getAttribute('data-template-controls-step'));

      if (toggleEl && contentEl) {
        // Add transition styles to match control steps
        contentEl.style.transition = 'height 0.6s ease-in-out';
        contentEl.style.overflow = 'hidden';

        // Initialize all template accordions to be closed
        contentEl.style.height = '0px';
        toggleEl.style.opacity = '0.6';

        toggleEl.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation(); // Prevent any other click listeners

          const isActiveCustomizeTab = document.querySelector('[data-card-tab-link="customize"].is-active');
          if (isActiveCustomizeTab) return; // Do nothing if customize tab is active

          if (currentTemplateStep === step && contentEl.style.height !== '0px') {
            // If clicking the currently open step, close it
            contentEl.style.height = '0px';
            toggleEl.style.opacity = '0.6';
            contentEl.classList.remove('opened');
          } else {
            // If clicking a new step or a closed step, open it and close others
            openTemplateStep(step);
          }
        });
      }
    });

    function openTemplateStep(stepNumber) {
      templateAccordionItems.forEach(item => {
        const step = parseInt(item.getAttribute('data-template-controls-step'));
        const contentEl = item.querySelector('.c_accordian-content');
        const toggleEl = item.querySelector('.c_accordian-link');

        if (!contentEl || !toggleEl) return;

        if (step === stepNumber) {
          // Open this step
          contentEl.classList.add('opened');
          contentEl.style.height = 'auto'; // Get natural height
          const actualHeight = contentEl.scrollHeight;
          contentEl.style.height = '0px'; // Reset for animation
          contentEl.offsetHeight; // Force reflow
          contentEl.style.height = actualHeight + 'px';
          toggleEl.style.opacity = '1';
          currentTemplateStep = stepNumber;
        } else {
          // Close other steps
          contentEl.style.height = '0px';
          toggleEl.style.opacity = '0.6';
          contentEl.classList.remove('opened');
        }

        // Update template header when step 1 is closed
        if (step === 1 && stepNumber !== 1 && typeof window.updateTemplateStep1Header === 'function') {
          window.updateTemplateStep1Header();
        }
      });
      updateButtonStates(); // Update buttons after template step changes
    }

    // Next button click handler
    const nextBtn = document.querySelector('[data-control-btn="next"]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const isActiveCustomizeTab = document.querySelector('[data-card-tab-link="customize"].is-active');

        if (isActiveCustomizeTab) {
          const totalCustomizeSteps = customizeAccordionItems.length;
          if (currentCustomizeStep < totalCustomizeSteps) {
            openCustomizeStep(currentCustomizeStep + 1);
          } else {
            // Download preview when on final step
            downloadCanvasPreview();
          }
        } else {
          const totalTemplateSteps = templateAccordionItems.length;
          if (currentTemplateStep < totalTemplateSteps) {
            openTemplateStep(currentTemplateStep + 1);
          } else {
            // Download preview when on final step
            downloadCanvasPreview();
          }
        }
      });
    }

    // Back button click handler
    const backBtn = document.querySelector('[data-control-btn="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const isActiveCustomizeTab = document.querySelector('[data-card-tab-link="customize"].is-active');
        if (isActiveCustomizeTab) {
          if (currentCustomizeStep > 1) {
            openCustomizeStep(currentCustomizeStep - 1);
          }
        } else {
          if (currentTemplateStep > 1) {
            openTemplateStep(currentTemplateStep - 1);
          }
        }
      });
    }

    // Initialize on page load
    const activeTabLink = document.querySelector('[data-card-tab-link].is-active');
    const initialTabType = activeTabLink ? activeTabLink.getAttribute('data-card-tab-link') : 'customize';

    // Ensure mask is positioned correctly on load if it wasn't handled by firstTab logic
    // (though it should be, this is a safeguard or if initial active tab is different)
    if (activeMask && activeTabLink && !firstTab) { // only if firstTab wasn't the one initially set
      updateActiveMaskPosition(activeTabLink);
    }

    toggleControlSteps(initialTabType === 'customize');
    if (initialTabType === 'templates') {
      openTemplateStep(1); // Open first template step if template tab is initially active
      // Call template header update if available
      if (typeof window.updateTemplateStep1Header === 'function') {
        setTimeout(window.updateTemplateStep1Header, 100);
      }
    } else {
      openCustomizeStep(1); // Open first customize step if customize tab is initially active
    }
    updateStepCountNumbers(); // Ensure counts are updated on load
    updateButtonStates(); // Ensure buttons are updated on load

    // Add event listeners for window resize and orientation change
    window.addEventListener('resize', () => {
      const activeTabLink = document.querySelector('[data-card-tab-link].is-active');
      if (activeTabLink) {
        updateActiveMaskPosition(activeTabLink);
      }
    });

    window.addEventListener('orientationchange', () => {
      const activeTabLink = document.querySelector('[data-card-tab-link].is-active');
      if (activeTabLink) {
        // Adding a slight delay for orientation change to allow layout to settle
        setTimeout(() => {
          updateActiveMaskPosition(activeTabLink);
        }, 100);
      }
    });
  }
});


// Handle card design selection
document.addEventListener('DOMContentLoaded', function () {
  // Remove duplicate design selection logic - this is now handled by stateManagement.js
  // The state management system will handle design selection and update the UI accordingly

  // Keep only the color section visibility logic if needed, but this should also be in state management
  let selectedDesign = 'classic'; // Default design
  const duotoneColorsWrapper = document.querySelector('[data-adjust-colors-wrapper="duotone"]');
  const gradientColorsWrapper = document.querySelector('[data-adjust-colors-wrapper="gradient"]');
  const classicColorsWrapper = document.querySelector('[data-adjust-colors-wrapper="classic"]');

  function updateColorSectionsVisibility() {
    // Handle duotone wrapper
    if (duotoneColorsWrapper) {
      duotoneColorsWrapper.style.display = (selectedDesign === 'duotone') ? '' : 'none';
    }

    // Handle gradient wrapper
    if (gradientColorsWrapper) {
      gradientColorsWrapper.style.display = (selectedDesign === 'gradient') ? '' : 'none';
    }

    // Handle classic wrapper
    if (classicColorsWrapper) {
      classicColorsWrapper.style.display = (selectedDesign === 'classic') ? '' : 'none';
    }
  }

  // Note: Design selection logic is now handled by stateManagement.js
  // This ensures single source of truth for state management

  // Set initial visibility based on default state
  if (window.cardState && window.cardState.customDesign) {
    selectedDesign = window.cardState.customDesign;
  }
  updateColorSectionsVisibility();
});





// Handle template option selection
document.addEventListener('DOMContentLoaded', function () {
  // Remove duplicate template selection logic - this is now handled by stateManagement.js
  // The state management system will handle template selection and update the UI accordingly

  let selectedTemplate = '01'; // Default template
  const templateItems = document.querySelectorAll('[data-template-option]');
  const templateOptionTagElement = document.getElementById('templateOptionTag');
  window.selectedTemplateName = '01'; // Default template name

  // Function to update the header of Template Step 1
  window.updateTemplateStep1Header = function () {
    if (!templateOptionTagElement) {
      return; // Safety check
    }

    // Always show the template option tag and sync with current state
    if (window.updateTemplateOptionTag) {
      window.updateTemplateOptionTag();
    } else {
      // Fallback if updateTemplateOptionTag is not available yet
      if (window.selectedTemplateName) {
        templateOptionTagElement.textContent = window.selectedTemplateName;
        templateOptionTagElement.style.display = 'inline';
      }
    }
  }

  // Note: Template selection logic is now handled by stateManagement.js
  // This ensures single source of truth for state management

  // Set initial template name based on default state
  if (window.cardState && window.cardState.selectedTemplateId) {
    const initialTemplateElement = document.querySelector(`[data-template-option="${window.cardState.selectedTemplateId}"]`);
    if (initialTemplateElement) {
      const nameElement = initialTemplateElement.querySelector('div:not(.card_design-item)');
      window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : window.cardState.selectedTemplateId;
    }
  } else if (templateItems.length > 0) {
    // Fallback to first template if no state is set
    const firstTemplateElement = templateItems[0];
    const nameElement = firstTemplateElement.querySelector('div:not(.card_design-item)');
    window.selectedTemplateName = nameElement ? nameElement.textContent.trim() : '01';
  }
});
