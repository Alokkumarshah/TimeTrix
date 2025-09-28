import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Plus, Search, Sparkles, Filter, CheckSquare, Square } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';
import CosmicBackground from './CosmicBackground';

const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onBulkDelete,
  onCreate,
  title,
  searchable = true,
  filterable = false,
  loading = false,
  emptyMessage = "No data available",
  selectable = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState(new Set());

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return columns.some(column => {
      const value = column.accessor ? item[column.accessor] : '';
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = columns.find(col => col.key === sortConfig.key)?.accessor 
      ? a[columns.find(col => col.key === sortConfig.key).accessor] 
      : '';
    const bValue = columns.find(col => col.key === sortConfig.key)?.accessor 
      ? b[columns.find(col => col.key === sortConfig.key).accessor] 
      : '';

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedItems.size === sortedData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(sortedData.map(item => item._id)));
    }
  };

  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size > 0 && onBulkDelete) {
      const selectedData = sortedData.filter(item => selectedItems.has(item._id));
      onBulkDelete(selectedData);
      setSelectedItems(new Set());
    }
  };

  const isAllSelected = sortedData.length > 0 && selectedItems.size === sortedData.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < sortedData.length;

  if (loading) {
    return (
      <ScrollAnimation animation="scaleIn" className="card-gradient">
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="spinner w-12 h-12"
          />
        </div>
      </ScrollAnimation>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">
      {/* Cosmic Background */}
      <CosmicBackground type="stars" />
      <CosmicBackground type="light-spot" followMouse={true} />
      
      <ScrollAnimation animation="slideUp" className="card-gradient hover-lift mouse-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-6 w-6 text-primary-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display gradient-text">
            {title}
          </h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {searchable && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="input-field pl-12 w-full sm:w-64 mouse-shadow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </motion.div>
          )}
          
          {selectable && selectedItems.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              onClick={handleBulkDelete}
              className="btn-danger flex items-center space-x-2 group relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Delete Selected ({selectedItems.size})</span>
            </motion.button>
          )}
          
          {onCreate && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onCreate}
              className="btn-primary flex items-center space-x-2 group relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Add New</span>
              
            </motion.button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container hover-lift">
        <table className="table">
          <thead className="table-header">
            <tr>
              {selectable && (
                <motion.th
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="table-header-cell w-12"
                >
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center w-full h-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors duration-200"
                    title={isAllSelected ? 'Deselect All' : 'Select All'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    ) : isIndeterminate ? (
                      <div className="h-5 w-5 border-2 border-primary-600 dark:border-primary-400 rounded bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary-600 dark:bg-primary-400 rounded-sm" />
                      </div>
                    ) : (
                      <Square className="h-5 w-5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200" />
                    )}
                  </button>
                </motion.th>
              )}
              {columns.map((column, index) => (
                <motion.th
                  key={column.key}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (selectable ? 1 : 0) + index * 0.05 }}
                  className={`table-header-cell ${column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{column.header}</span>
                    {column.sortable && sortConfig.key === column.key && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary-600 dark:text-primary-400"
                      >
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </motion.span>
                    )}
                  </div>
                </motion.th>
              ))}
              {(onEdit || onDelete) && (
                <motion.th
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + (selectable ? 1 : 0) + columns.length * 0.05 }}
                  className="table-header-cell"
                >
                  Actions
                </motion.th>
              )}
            </tr>
          </thead>
          <tbody className="table-body">
            <AnimatePresence>
              {sortedData.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0) + (selectable ? 1 : 0)}
                    className="px-6 py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full"
                      >
                        <Filter className="h-8 w-8 text-slate-400" />
                      </motion.div>
                      <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                        {emptyMessage}
                      </p>
                    </motion.div>
                  </td>
                </motion.tr>
              ) : (
                sortedData.map((item, index) => (
                  <motion.tr
                    key={item._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`table-row hover-lift mouse-shadow ${selectedItems.has(item._id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                    whileHover={{ scale: 1.01 }}
                  >
                    {selectable && (
                      <td className="table-cell w-12">
                        <button
                          onClick={() => handleSelectItem(item._id)}
                          className="flex items-center justify-center w-full h-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors duration-200"
                        >
                          {selectedItems.has(item._id) ? (
                            <CheckSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="table-cell">
                        {column.render ? column.render(item) : item[column.accessor]}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          {onEdit && (
                            <motion.button
                              onClick={() => onEdit(item)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-glow"
                              title="Edit"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit className="h-4 w-4" />
                            </motion.button>
                          )}
                          {onDelete && (
                            <motion.button
                              onClick={() => onDelete(item)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 transform hover:scale-110 hover:shadow-glow"
                              title="Delete"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {sortedData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Showing {sortedData.length} of {data.length} entries</span>
          </div>
          {searchTerm && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-xs font-medium"
            >
              Filtered by "{searchTerm}"
            </motion.span>
          )}
        </motion.div>
      )}
    </ScrollAnimation>
    </div>
  );
};

export default DataTable;
