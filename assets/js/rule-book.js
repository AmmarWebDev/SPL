"use strict";

//! CONSTANTS //
const rulesWrapper = document.getElementById('rules-wrapper');
const pagination = document.querySelector('.pagination');

//! NAVBAR HIGHLIGHT //
document.querySelector('.navbar-collapse a[href="index.html"]').classList.toggle('active');
document.querySelector('.navbar-collapse a[href="rule-book.html"]').classList.toggle('active');

//! FETCHING RULES //
axios.get('database/rules.txt')
  .then(response => {
    const data = response.data;
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
    const linesPerPage = 9;
    const pagesNo = Math.ceil(lines.length / linesPerPage);

    let currentPage = 1;

    // Render rules for current page with rule numbers
    const renderRules = () => {
      rulesWrapper.innerHTML = '';
      const start = (currentPage - 1) * linesPerPage;
      const end = start + linesPerPage;
      const pageLines = lines.slice(start, end);

      pageLines.forEach((line, index) => {
        const ruleNumber = start + index + 1;
        rulesWrapper.innerHTML += `<li class="list-group-item py-3">${ruleNumber}. ${line}</li>`;
      });
    };

    // Render pagination with looping support
    const renderPagination = () => {
      pagination.innerHTML = '';

      // Previous button
      pagination.innerHTML += `
        <li class="page-item">
          <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
      `;

      // Page number buttons
      for (let i = 1; i <= pagesNo; i++) {
        pagination.innerHTML += `
          <li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#page-${i}">${i}</a>
          </li>
        `;
      }

      // Next button
      pagination.innerHTML += `
        <li class="page-item">
          <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      `;

      // === Event Listeners === //

      // Looping Previous button
      document.querySelector('a[aria-label="Previous"]').onclick = e => {
        e.preventDefault();
        currentPage = currentPage === 1 ? pagesNo : currentPage - 1;
        renderRules();
        renderPagination();
      };

      // Looping Next button
      document.querySelector('a[aria-label="Next"]').onclick = e => {
        e.preventDefault();
        currentPage = currentPage === pagesNo ? 1 : currentPage + 1;
        renderRules();
        renderPagination();
      };

      // Page number buttons
      document.querySelectorAll('.page-link[href^="#page-"]').forEach(link => {
        link.onclick = e => {
          e.preventDefault();
          const pageNum = parseInt(link.textContent);
          if (!isNaN(pageNum) && pageNum !== currentPage) {
            currentPage = pageNum;
            renderRules();
            renderPagination();
          }
        };
      });
    };

    // Initial render
    renderRules();
    renderPagination();
  });
