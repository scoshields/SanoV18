import { SESSION_SECTIONS, ASSESSMENT_SECTIONS } from './responseProcessor/constants';
import type { NoteSection } from '../types';

function cleanContent(content: string): string {
  return content
    .replace(/^\s+|\s+$/g, '')     // Trim start/end whitespace
    .replace(/\n{3,}/g, '\n\n')    // Normalize multiple newlines
    .replace(/\[\s*|\s*\]/g, '');  // Remove square brackets
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseSections(content: string, isAssessment: boolean): NoteSection[] {
  const sections = isAssessment ? ASSESSMENT_SECTIONS : SESSION_SECTIONS;
  const cleanedContent = cleanContent(content);
  const result: NoteSection[] = [];

  sections.forEach((heading, index) => {
    const escapedHeading = escapeRegExp(heading);
    const nextHeading = sections[index + 1] ? escapeRegExp(sections[index + 1]) : null;
    
    const startRegex = new RegExp(`${escapedHeading}:(?:\\s*\\n*\\r*)`);
    const endRegex = nextHeading
      ? new RegExp(`(?:\\s*\\n*\\r*)${nextHeading}:`)
      : new RegExp('\\s*$');

    const startMatch = cleanedContent.match(startRegex);
    if (startMatch) {
      const startIndex = startMatch.index! + startMatch[0].length;
      const remainingContent = cleanedContent.slice(startIndex);
      const endMatch = remainingContent.match(endRegex);
      const endIndex = endMatch
        ? startIndex + endMatch.index!
        : cleanedContent.length;

      const sectionContent = cleanedContent
        .slice(startIndex, endIndex)
        .trim();

      if (sectionContent) {
        result.push({
          id: heading.toLowerCase().replace(/\s+/g, '-'),
          heading,
          content: sectionContent.replace(/\n{2,}/g, '\n\n'),
          isProcessing: false
        });
      }
    }
  });

  return result;
}