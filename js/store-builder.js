const StoreBuilder = (function() {
  'use strict';

  let products = [];
  let categories = [];
  let components = [];
  let droppedComponents = [];
  let activeCategory = 'all';
  let draggedItem = null;

  function init() {
    loadProductsData();
    bindEvents();
  }

  function loadProductsData() {
    fetch('data/products.json')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        products = data.products || [];
        categories = data.categories || [];
        components = data.storeComponents || [];
        renderProducts();
        renderComponents();
        renderCategoryFilters();
        loadSavedLayout();
      })
      .catch(function(error) {
        console.error('Failed to load products data:', error);
        products = getDefaultProducts();
        categories = getDefaultCategories();
        components = getDefaultComponents();
        renderProducts();
        renderComponents();
        renderCategoryFilters();
      });
  }

  function getDefaultProducts() {
    return [
      { id: 1, name: 'Sample Product', category: 'clothing', price: 500, description: 'A sample product', seller: 'Demo Store', rating: 4.5 }
    ];
  }

  function getDefaultCategories() {
    return [
      { id: 'clothing', name: 'Clothing', icon: 'fa-tshirt' },
      { id: 'food', name: 'Food', icon: 'fa-utensils' }
    ];
  }

  function getDefaultComponents() {
    return [
      { id: 'header', name: 'Store Header', icon: 'fa-heading', type: 'layout' },
      { id: 'products', name: 'Product Grid', icon: 'fa-th', type: 'content' },
      { id: 'footer', name: 'Store Footer', icon: 'fa-shoe-prints', type: 'layout' }
    ];
  }

  function bindEvents() {
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('filter-btn')) {
        const category = e.target.dataset.category;
        filterProducts(category);
      }

      if (e.target.closest('.remove-component')) {
        const btn = e.target.closest('.remove-component');
        const index = parseInt(btn.dataset.index);
        removeComponent(index);
      }

      if (e.target.closest('.clear-canvas-btn')) {
        clearCanvas();
      }

      if (e.target.closest('.preview-btn')) {
        previewStore();
      }

      if (e.target.closest('.save-layout-btn')) {
        saveLayout();
      }
    });

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
  }

  function renderProducts() {
    const container = document.querySelector('.products-grid');
    if (!container) return;

    const filteredProducts = activeCategory === 'all' 
      ? products 
      : products.filter(function(p) { return p.category === activeCategory; });

    if (filteredProducts.length === 0) {
      container.innerHTML = '<p class="no-products">No products found in this category.</p>';
      return;
    }

    let html = '';
    filteredProducts.forEach(function(product) {
      const category = categories.find(function(c) { return c.id === product.category; });
      const categoryIcon = category ? category.icon : 'fa-box';

      html += 
        '<div class="product-card" data-id="' + product.id + '">' +
          '<div class="product-image">' +
            '<i class="fas ' + categoryIcon + '"></i>' +
          '</div>' +
          '<div class="product-info">' +
            '<h4>' + product.name + '</h4>' +
            '<p class="product-seller">' + product.seller + '</p>' +
            '<p class="product-price">₹' + product.price + '</p>' +
            '<div class="product-rating">' +
              '<i class="fas fa-star"></i>' +
              '<span>' + product.rating + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function renderCategoryFilters() {
    const container = document.querySelector('.catalog-filters');
    if (!container) return;

    let html = '<button class="filter-btn active" data-category="all">All</button>';
    
    categories.forEach(function(category) {
      html += '<button class="filter-btn" data-category="' + category.id + '">' +
              '<i class="fas ' + category.icon + '"></i> ' + category.name + 
              '</button>';
    });

    container.innerHTML = html;
  }

  function filterProducts(category) {
    activeCategory = category;
    
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.classList.remove('active');
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      }
    });

    renderProducts();
  }

  function renderComponents() {
    const container = document.querySelector('.component-list');
    if (!container) return;

    let html = '';
    components.forEach(function(component) {
      html += 
        '<div class="component-item" draggable="true" data-id="' + component.id + '">' +
          '<div class="component-icon">' +
            '<i class="fas ' + component.icon + '"></i>' +
          '</div>' +
          '<span>' + component.name + '</span>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function handleDragStart(e) {
    const item = e.target.closest('.component-item');
    if (!item) return;

    draggedItem = item.dataset.id;
    item.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', draggedItem);
  }

  function handleDragEnd(e) {
    const item = e.target.closest('.component-item');
    if (item) {
      item.classList.remove('dragging');
    }
    draggedItem = null;
  }

  function handleDragOver(e) {
    const canvas = e.target.closest('.canvas-area');
    if (canvas && draggedItem) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      canvas.classList.add('drag-over');
    }
  }

  function handleDragLeave(e) {
    const canvas = e.target.closest('.canvas-area');
    if (canvas) {
      canvas.classList.remove('drag-over');
    }
  }

  function handleDrop(e) {
    const canvas = e.target.closest('.canvas-area');
    if (!canvas || !draggedItem) return;

    e.preventDefault();
    canvas.classList.remove('drag-over');

    const componentId = e.dataTransfer.getData('text/plain') || draggedItem;
    addComponentToCanvas(componentId);
    draggedItem = null;
  }

  function addComponentToCanvas(componentId) {
    const component = components.find(function(c) { return c.id === componentId; });
    if (!component) return;

    droppedComponents.push({
      id: componentId,
      name: component.name,
      icon: component.icon,
      addedAt: Date.now()
    });

    renderCanvas();
  }

  function removeComponent(index) {
    droppedComponents.splice(index, 1);
    renderCanvas();
  }

  function clearCanvas() {
    droppedComponents = [];
    renderCanvas();
    localStorage.removeItem('digital-mira-store-layout');
  }

  function renderCanvas() {
    const canvas = document.querySelector('.canvas-area');
    if (!canvas) return;

    if (droppedComponents.length === 0) {
      canvas.innerHTML = 
        '<div class="canvas-placeholder">' +
          '<i class="fas fa-mouse-pointer"></i>' +
          '<p>Drag components here to build your store</p>' +
        '</div>';
      return;
    }

    let html = '';
    droppedComponents.forEach(function(comp, index) {
      html += 
        '<div class="dropped-component">' +
          '<div class="dropped-component-info">' +
            '<div class="component-icon">' +
              '<i class="fas ' + comp.icon + '"></i>' +
            '</div>' +
            '<span>' + comp.name + '</span>' +
          '</div>' +
          '<div class="dropped-component-actions">' +
            '<button class="btn btn-ghost btn-icon remove-component" data-index="' + index + '" aria-label="Remove ' + comp.name + '">' +
              '<i class="fas fa-times"></i>' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    canvas.innerHTML = html;
  }

  function saveLayout() {
    localStorage.setItem('digital-mira-store-layout', JSON.stringify(droppedComponents));
    showNotification('Layout saved successfully!', 'success');
    
    if (typeof AuthSimulator !== 'undefined' && AuthSimulator.isAuthenticated()) {
      AuthSimulator.updateProgress('udyam', Math.min(100, droppedComponents.length * 12.5));
    }
  }

  function loadSavedLayout() {
    const saved = localStorage.getItem('digital-mira-store-layout');
    if (saved) {
      try {
        droppedComponents = JSON.parse(saved);
        renderCanvas();
      } catch (e) {
        console.error('Failed to load saved layout:', e);
      }
    }
  }

  function previewStore() {
    if (droppedComponents.length === 0) {
      showNotification('Add some components first!', 'warning');
      return;
    }

    showNotification('Store preview is being generated...', 'info');
    
    setTimeout(function() {
      showNotification('Preview feature coming soon!', 'info');
    }, 1000);
  }

  function showNotification(message, type) {
    const existing = document.querySelector('.store-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'store-notification alert alert-' + type;
    notification.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999; animation: modalSlideIn 0.3s ease;';
    notification.innerHTML = '<i class="fas fa-' + 
      (type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle') + 
      '"></i><span>' + message + '</span>';

    document.body.appendChild(notification);

    setTimeout(function() {
      notification.remove();
    }, 3000);
  }

  function getProducts() {
    return products;
  }

  function getLayout() {
    return droppedComponents;
  }

  return {
    init: init,
    getProducts: getProducts,
    getLayout: getLayout,
    filter: filterProducts,
    save: saveLayout,
    clear: clearCanvas
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.store-builder-content') || document.querySelector('.product-catalog')) {
    StoreBuilder.init();
  }
});
