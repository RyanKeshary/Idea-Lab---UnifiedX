const ChatBot = (function() {
  'use strict';

  let conversations = [];
  let quickReplies = [];
  let greeting = '';
  let fallbackMessage = '';
  let isOpen = false;

  function init() {
    loadChatbotData();
    bindEvents();
    renderQuickReplies();
  }

  function loadChatbotData() {
    fetch('data/chatbot-script.json')
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        conversations = data.conversations || [];
        quickReplies = data.quickReplies || [];
        greeting = data.greeting || 'Hello! How can I help you?';
        fallbackMessage = data.fallback || 'I\'m not sure I understand. Could you try rephrasing?';
        
        if (!hasMessages()) {
          addBotMessage(greeting);
        }
        renderQuickReplies();
      })
      .catch(function(error) {
        console.error('Failed to load chatbot data:', error);
        conversations = getDefaultConversations();
        greeting = 'Hello! I\'m Mira, your Digital Shield assistant.';
        fallbackMessage = 'I\'m not sure I understand. Please try again.';
        
        if (!hasMessages()) {
          addBotMessage(greeting);
        }
      });
  }

  function getDefaultConversations() {
    return [
      {
        id: 'help',
        keywords: ['help', 'menu', 'options'],
        question: 'Show help',
        response: 'I can help you with cybersecurity topics like phishing, passwords, and online safety.',
        followUp: []
      }
    ];
  }

  function bindEvents() {
    const toggle = document.querySelector('.chatbot-toggle');
    const input = document.querySelector('.chatbot-input input');
    const sendBtn = document.querySelector('.chatbot-input button');

    if (toggle) {
      toggle.addEventListener('click', toggleChat);
    }

    if (input) {
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('quick-reply')) {
        const id = e.target.dataset.id;
        handleQuickReply(id);
      }
    });
  }

  function toggleChat() {
    const widget = document.querySelector('.chatbot-widget');
    if (widget) {
      isOpen = !isOpen;
      widget.classList.toggle('open', isOpen);
      
      if (isOpen) {
        const input = document.querySelector('.chatbot-input input');
        if (input) {
          setTimeout(function() { input.focus(); }, 300);
        }
      }
    }
  }

  function sendMessage() {
    const input = document.querySelector('.chatbot-input input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    addUserMessage(message);
    input.value = '';

    showTypingIndicator();

    setTimeout(function() {
      hideTypingIndicator();
      const response = findResponse(message);
      addBotMessage(response.text);
      
      if (response.followUp && response.followUp.length > 0) {
        updateQuickReplies(response.followUp);
      }
    }, 1000 + Math.random() * 1000);
  }

  function handleQuickReply(id) {
    const conv = conversations.find(function(c) { return c.id === id; });
    if (conv) {
      addUserMessage(conv.question);
      
      showTypingIndicator();
      
      setTimeout(function() {
        hideTypingIndicator();
        addBotMessage(conv.response);
        
        if (conv.followUp && conv.followUp.length > 0) {
          updateQuickReplies(conv.followUp);
        }
      }, 800 + Math.random() * 800);
    }
  }

  function findResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];
      const hasKeyword = conv.keywords.some(function(keyword) {
        return lowerMessage.includes(keyword.toLowerCase());
      });
      
      if (hasKeyword) {
        return {
          text: conv.response,
          followUp: conv.followUp || []
        };
      }
    }
    
    return {
      text: fallbackMessage,
      followUp: ['main_menu']
    };
  }

  function addUserMessage(text) {
    const container = document.querySelector('.chatbot-messages');
    if (!container) return;

    const messageHtml = 
      '<div class="chat-message user">' +
        '<div class="message-content">' + escapeHtml(text) + '</div>' +
        '<div class="message-avatar"><i class="fas fa-user"></i></div>' +
      '</div>';

    container.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
  }

  function addBotMessage(text) {
    const container = document.querySelector('.chatbot-messages');
    if (!container) return;

    const formattedText = formatMessage(text);
    
    const messageHtml = 
      '<div class="chat-message bot">' +
        '<div class="message-avatar"><i class="fas fa-shield-alt"></i></div>' +
        '<div class="message-content">' + formattedText + '</div>' +
      '</div>';

    container.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
  }

  function formatMessage(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showTypingIndicator() {
    const container = document.querySelector('.chatbot-messages');
    if (!container) return;

    const typingHtml = 
      '<div class="chat-message bot typing-message">' +
        '<div class="message-avatar"><i class="fas fa-shield-alt"></i></div>' +
        '<div class="message-content">' +
          '<div class="typing-indicator">' +
            '<span></span><span></span><span></span>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const typing = document.querySelector('.typing-message');
    if (typing) {
      typing.remove();
    }
  }

  function renderQuickReplies() {
    const container = document.querySelector('.quick-replies');
    if (!container || quickReplies.length === 0) return;

    let html = '';
    quickReplies.forEach(function(reply) {
      html += '<button class="quick-reply" data-id="' + reply.id + '">' + 
              escapeHtml(reply.label) + '</button>';
    });

    container.innerHTML = html;
  }

  function updateQuickReplies(followUpIds) {
    const container = document.querySelector('.quick-replies');
    if (!container) return;

    let html = '';
    followUpIds.forEach(function(id) {
      const conv = conversations.find(function(c) { return c.id === id; });
      if (conv) {
        html += '<button class="quick-reply" data-id="' + id + '">' + 
                escapeHtml(conv.question) + '</button>';
      }
    });

    container.innerHTML = html;
  }

  function scrollToBottom() {
    const container = document.querySelector('.chatbot-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  function hasMessages() {
    const container = document.querySelector('.chatbot-messages');
    return container && container.children.length > 0;
  }

  function open() {
    if (!isOpen) {
      toggleChat();
    }
  }

  function close() {
    if (isOpen) {
      toggleChat();
    }
  }

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggleChat
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.chatbot-widget')) {
    ChatBot.init();
  }
});
