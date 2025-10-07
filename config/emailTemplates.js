import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions for templates
handlebars.registerHelper('formatDate', function(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

handlebars.registerHelper('capitalize', function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});

handlebars.registerHelper('formatSalary', function(min, max, currency, period) {
    if (!min && !max) return 'Not specified';
    const formatted = `${currency} ${min ? min.toLocaleString() : ''}${max ? ' - ' + max.toLocaleString() : '+'}`;
    return `${formatted} / ${period}`;
});

handlebars.registerHelper('formatLocation', function(location) {
    if (location.type === 'remote') return 'Remote';
    return `${location.city || ''}, ${location.country || ''}`.trim();
});

// Load and compile templates
const loadTemplate = (templateName) => {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return handlebars.compile(templateSource);
};

export { loadTemplate };