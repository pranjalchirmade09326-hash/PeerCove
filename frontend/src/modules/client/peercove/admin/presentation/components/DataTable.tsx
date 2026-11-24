/**
 * Presentation: DataTable
 * Reusable paginated data display component with sorting and filtering
 * Presentation layer - React component
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  testId?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function DataTable<T extends { id?: string | number }> ({
  data,
  columns,
  pageSize = 10,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  testId = 'data-table',
}: DataTableProps<T>): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  }, []);

  // Filter and search
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return String(value).toLowerCase().includes(lowerSearchTerm);
        })
      );
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
      result = result.filter((row) =>
        Object.entries(filters).every(([key, value]) => {
          const rowValue = row[key as keyof T];
          return String(rowValue).toLowerCase() === value.toLowerCase();
        })
      );
    }

    return result;
  }, [data, searchTerm, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // Handle filter change
  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[columnKey] = value;
      } else {
        delete newFilters[columnKey];
      }
      return newFilters;
    });
    setCurrentPage(1);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="data-table-loading" data-testid={`${testId}-loading`}>
        <div className="loading-rows">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredData.length === 0) {
    return (
      <div className="data-table-empty" data-testid={`${testId}-empty`}>
        <div className="search-bar">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
            aria-label="Search table"
          />
        </div>
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table" data-testid={testId}>
      {/* Search Bar */}
      <div className="table-controls">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
          aria-label="Search table"
          data-testid={`${testId}-search`}
        />
        <span className="result-count">
          {filteredData.length} result{filteredData.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table-content" role="grid">
          <thead>
            <tr role="row">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  role="columnheader"
                  style={{ width: col.width }}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                  data-testid={`header-${String(col.key)}`}
                >
                  <div className="header-content">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="sort-icon">
                        {sortConfig?.key === String(col.key) && (
                          <span className={`arrow ${sortConfig.direction}`}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  {col.filterable && (
                    <input
                      type="text"
                      placeholder={`Filter by ${col.label.toLowerCase()}`}
                      value={filters[String(col.key)] || ''}
                      onChange={(e) =>
                        handleFilterChange(String(col.key), e.target.value)
                      }
                      className="filter-input"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Filter by ${col.label}`}
                      data-testid={`filter-${String(col.key)}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                role="row"
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'clickable' : ''}
                data-testid={`row-${rowIndex}`}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    role="gridcell"
                    className={`cell-${String(col.key)}`}
                    data-testid={`cell-${String(col.key)}-${rowIndex}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination" data-testid={`${testId}-pagination`}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
            aria-label="Previous page"
            data-testid={`${testId}-prev`}
          >
            ← Previous
          </button>

          <div className="page-info">
            Page <span className="current-page">{currentPage}</span> of{' '}
            <span className="total-pages">{totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
            aria-label="Next page"
            data-testid={`${testId}-next`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
