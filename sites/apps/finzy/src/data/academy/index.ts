import { articlesLevel1FR } from './articles-level1-fr';
import { articlesLevel2FR } from './articles-level2-fr';
import { articlesLevel3FR } from './articles-level3-fr';
import { articlesSwiss } from './articles-swiss';
import { academyCategories, levelInfo } from './categories';
import type { AcademyArticle } from './types';

// Combine all articles
export const allArticles: AcademyArticle[] = [
  ...articlesLevel1FR,
  ...articlesLevel2FR,
  ...articlesLevel3FR,
  ...articlesSwiss,
];

// Export by level
export const articlesByLevel = {
  1: allArticles.filter(a => a.level === 1),
  2: allArticles.filter(a => a.level === 2),
  3: allArticles.filter(a => a.level === 3),
};

// Export by market
export const articlesByMarket = {
  FR: allArticles.filter(a => a.market === 'FR' || a.market === 'BOTH'),
  CH: allArticles.filter(a => a.market === 'CH' || a.market === 'BOTH'),
};

// Get articles for a specific market and level
export function getArticles(market: 'FR' | 'CH', level?: 1 | 2 | 3): AcademyArticle[] {
  let filtered = allArticles.filter(a => a.market === market || a.market === 'BOTH');
  if (level) {
    filtered = filtered.filter(a => a.level === level);
  }
  return filtered;
}

// Get article by slug
export function getArticleBySlug(slug: string): AcademyArticle | undefined {
  return allArticles.find(a => a.slug === slug);
}

// Get article by id
export function getArticleById(id: string): AcademyArticle | undefined {
  return allArticles.find(a => a.id === id);
}

// Export categories and level info
export { academyCategories, levelInfo };
export type { AcademyArticle } from './types';
