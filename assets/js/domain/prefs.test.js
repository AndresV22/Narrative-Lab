import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAllAppLocalPreferences,
  getDashboardBookFilter,
  getEditorMarginHorizontalCm,
  getEditorMarginVerticalCm,
  resetLegacyEditorMarginsMigrationForTests,
  setDashboardBookFilter,
  setEditorMarginHorizontalCm,
  setEditorMarginVerticalCm,
} from './prefs.js';

beforeEach(() => {
  localStorage.clear();
  resetLegacyEditorMarginsMigrationForTests();
});

describe('prefs — márgenes y localStorage', () => {
  it('get/set márgenes en cm respeta límites 0–5', () => {
    setEditorMarginHorizontalCm(2.5);
    setEditorMarginVerticalCm(10);
    expect(getEditorMarginHorizontalCm()).toBe(2.5);
    expect(getEditorMarginVerticalCm()).toBe(5);
    setEditorMarginHorizontalCm(-1);
    setEditorMarginVerticalCm(0);
    expect(getEditorMarginHorizontalCm()).toBe(0);
    expect(getEditorMarginVerticalCm()).toBe(0);
  });

  it('migra claves legacy nl_editor_margin_*_px a *_cm y elimina px', () => {
    localStorage.setItem('nl_editor_margin_x_px', '96');
    localStorage.setItem('nl_editor_margin_y_px', '48');
    getEditorMarginHorizontalCm();
    expect(localStorage.getItem('nl_editor_margin_x_px')).toBeNull();
    expect(localStorage.getItem('nl_editor_margin_y_px')).toBeNull();
    expect(localStorage.getItem('nl_editor_margin_x_cm')).toBe('2.54');
    expect(localStorage.getItem('nl_editor_margin_y_cm')).toBe('1.27');
    expect(getEditorMarginHorizontalCm()).toBe(2.54);
    expect(getEditorMarginVerticalCm()).toBe(1.27);
  });

  it('clearAllAppLocalPreferences elimina claves de márgenes y otras preferencias', () => {
    setEditorMarginHorizontalCm(3);
    setEditorMarginVerticalCm(2);
    localStorage.setItem('nl_autosave_ms', '5000');
    localStorage.setItem('nl_progress_mode', 'debounce');
    setDashboardBookFilter('subset', ['x']);
    clearAllAppLocalPreferences();
    expect(localStorage.getItem('nl_editor_margin_x_cm')).toBeNull();
    expect(localStorage.getItem('nl_editor_margin_y_cm')).toBeNull();
    expect(localStorage.getItem('nl_editor_margin_x_px')).toBeNull();
    expect(localStorage.getItem('nl_editor_margin_y_px')).toBeNull();
    expect(localStorage.getItem('nl_autosave_ms')).toBeNull();
    expect(localStorage.getItem('nl_progress_mode')).toBeNull();
    expect(localStorage.getItem('nl_dashboard_books_mode')).toBeNull();
    expect(localStorage.getItem('nl_dashboard_book_ids')).toBeNull();
  });

  it('get/set filtro dashboard (todos vs subconjunto)', () => {
    expect(getDashboardBookFilter().mode).toBe('all');
    setDashboardBookFilter('subset', ['a', 'b']);
    expect(getDashboardBookFilter().mode).toBe('subset');
    expect(getDashboardBookFilter().bookIds).toEqual(['a', 'b']);
    setDashboardBookFilter('all');
    expect(getDashboardBookFilter().mode).toBe('all');
    expect(localStorage.getItem('nl_dashboard_book_ids')).toBeNull();
  });
});
