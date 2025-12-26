// Budget Tracker App
class BudgetTracker {
    constructor() {
        this.budget = 0;
        this.items = [];
        this.init();
    }

    init() {
        // Load data from localStorage
        this.loadData();

        // Get DOM elements
        this.budgetInput = document.getElementById('budget-input');
        this.setBudgetBtn = document.getElementById('set-budget-btn');
        this.itemNameInput = document.getElementById('item-name');
        this.itemCostInput = document.getElementById('item-cost');
        this.addItemBtn = document.getElementById('add-item-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        this.itemsList = document.getElementById('items-list');

        // Add event listeners
        this.setBudgetBtn.addEventListener('click', () => this.setBudget());
        this.addItemBtn.addEventListener('click', () => this.addItem());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Enter key support
        this.budgetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setBudget();
        });

        this.itemNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        this.itemCostInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // Initial render
        this.render();
    }

    setBudget() {
        const value = parseFloat(this.budgetInput.value);

        if (isNaN(value) || value < 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        this.budget = value;
        this.budgetInput.value = '';
        this.saveData();
        this.render();
    }

    addItem() {
        const name = this.itemNameInput.value.trim();
        const cost = parseFloat(this.itemCostInput.value);

        if (!name) {
            alert('Please enter an item name');
            return;
        }

        if (isNaN(cost) || cost < 0) {
            alert('Please enter a valid cost');
            return;
        }

        const item = {
            id: Date.now(),
            name: name,
            cost: cost
        };

        this.items.push(item);
        this.itemNameInput.value = '';
        this.itemCostInput.value = '';
        this.itemNameInput.focus();

        this.saveData();
        this.render();
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveData();
        this.render();
    }

    clearAll() {
        if (this.items.length === 0 && this.budget === 0) {
            return;
        }

        if (confirm('Are you sure you want to clear all data?')) {
            this.budget = 0;
            this.items = [];
            this.saveData();
            this.render();
        }
    }

    calculateTotal() {
        return this.items.reduce((total, item) => total + item.cost, 0);
    }

    calculateBalance() {
        return this.budget - this.calculateTotal();
    }

    formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }

    render() {
        // Update budget display
        document.getElementById('total-budget').textContent = this.formatCurrency(this.budget);

        const totalSpent = this.calculateTotal();
        document.getElementById('total-spent').textContent = this.formatCurrency(totalSpent);

        const balance = this.calculateBalance();
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = this.formatCurrency(Math.abs(balance));

        // Update balance color and sign
        balanceElement.classList.remove('surplus', 'deficit');
        if (balance > 0) {
            balanceElement.classList.add('surplus');
            balanceElement.textContent = '+' + this.formatCurrency(balance);
        } else if (balance < 0) {
            balanceElement.classList.add('deficit');
            balanceElement.textContent = '-' + this.formatCurrency(Math.abs(balance));
        }

        // Render items list
        this.renderItems();
    }

    renderItems() {
        if (this.items.length === 0) {
            this.itemsList.innerHTML = '<p class="empty-message">No items added yet</p>';
            return;
        }

        this.itemsList.innerHTML = this.items.map(item => `
            <div class="item">
                <div class="item-info">
                    <span class="item-name">${this.escapeHtml(item.name)}</span>
                    <span class="item-cost">${this.formatCurrency(item.cost)}</span>
                </div>
                <button class="delete-btn" onclick="budgetTracker.deleteItem(${item.id})">Delete</button>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveData() {
        const data = {
            budget: this.budget,
            items: this.items
        };
        localStorage.setItem('budgetTrackerData', JSON.stringify(data));
    }

    loadData() {
        const data = localStorage.getItem('budgetTrackerData');
        if (data) {
            const parsed = JSON.parse(data);
            this.budget = parsed.budget || 0;
            this.items = parsed.items || [];
        }
    }
}

// Initialize the app
const budgetTracker = new BudgetTracker();
