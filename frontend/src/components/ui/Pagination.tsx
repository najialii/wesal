import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/lib/i18n/TranslationProvider';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
}) => {
  const { isRTL, t } = useTranslation('common');

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
      {/* Items info */}
      <div className="text-sm text-gray-700">
        {t('pagination.showing', { fallback: 'Showing' })}{' '}
        <span className="font-semibold">{startItem}</span> {t('pagination.to', { fallback: 'to' })}{' '}
        <span className="font-semibold">{endItem}</span> {t('pagination.of', { fallback: 'of' })}{' '}
        <span className="font-semibold">{totalItems}</span> {t('pagination.results', { fallback: 'results' })}
      </div>

      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Items per page selector */}
        {showItemsPerPage && onItemsPerPageChange && (
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <label htmlFor="itemsPerPage" className="text-sm text-gray-700 whitespace-nowrap">
              {t('pagination.items_per_page', { fallback: 'Items per page' })}:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className={`rounded-lg border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Previous button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isRTL ? 'rotate-180' : ''}`}
              aria-label={t('pagination.previous', { fallback: 'Previous' })}
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>

            {/* Page numbers */}
            <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => onPageChange(page as number)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isRTL ? 'rotate-180' : ''}`}
              aria-label={t('pagination.next', { fallback: 'Next' })}
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
