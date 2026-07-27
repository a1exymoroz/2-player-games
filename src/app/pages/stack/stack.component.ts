import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface StackItem {
  name: string;
  detail: string;
  icon: string;
}

interface StackCategory {
  title: string;
  icon: string;
  items: StackItem[];
}

@Component({
  selector: 'app-stack',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './stack.component.html',
  styleUrl: './stack.component.scss'
})
export class StackComponent {
  categories: StackCategory[] = [
    {
      title: 'Frontend',
      icon: '🎨',
      items: [
        { name: 'Angular', detail: '17.3 · Framework', icon: '🅰️' },
        { name: 'TypeScript', detail: '5.4 · Strict mode', icon: '🔷' },
        { name: 'SCSS', detail: 'Component-scoped styles', icon: '🎀' },
        { name: 'Angular Router', detail: 'Client-side routing', icon: '🧭' },
        { name: 'RxJS', detail: '7.8 · Reactive streams', icon: '🔄' }
      ]
    },
    {
      title: 'Architecture',
      icon: '🏗️',
      items: [
        { name: 'Standalone Components', detail: 'No NgModules', icon: '🧩' },
        { name: 'Client-side only', detail: 'No backend or database', icon: '💻' },
        { name: 'In-memory state', detail: 'Logic lives in components', icon: '🧠' },
        { name: 'Zone.js', detail: '0.14 · Change detection', icon: '⚡' }
      ]
    },
    {
      title: 'Build & Tooling',
      icon: '🛠️',
      items: [
        { name: 'Angular CLI', detail: '17.3 · Dev server & builds', icon: '⌨️' },
        { name: 'Node.js', detail: '18+ · Runtime', icon: '🟢' },
        { name: 'npm', detail: 'Package manager', icon: '📦' }
      ]
    },
    {
      title: 'Testing',
      icon: '✅',
      items: [
        { name: 'Karma', detail: '6.4 · Test runner', icon: '🎭' },
        { name: 'Jasmine', detail: '5.1 · Test framework', icon: '🍃' },
        { name: 'Coverage', detail: 'karma-coverage', icon: '📊' }
      ]
    },
    {
      title: 'Deployment',
      icon: '🚀',
      items: [
        { name: 'Static hosting', detail: 'Netlify, Vercel, GitHub Pages', icon: '☁️' },
        { name: 'ES2022', detail: 'Build target', icon: '🎯' },
        { name: 'dist/two-player-games', detail: 'Production output', icon: '📁' }
      ]
    }
  ];

  notInStack: string[] = [
    'Backend (Node, Python, etc.)',
    'Database',
    'Real-time multiplayer (WebSockets, Firebase)',
    'State management (NgRx, Akita)',
    'UI component library (Material, PrimeNG)',
    'CSS framework (Bootstrap, Tailwind)'
  ];
}
