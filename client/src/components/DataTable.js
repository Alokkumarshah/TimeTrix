import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Plus, Search, Sparkles, Filter } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';

const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onCreate,
  title,
  searchable = true,
  filterable = false,
  loading = false,
  emptyMessage = "No data available",
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer" />
              </div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container hover-lift">
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column, index) => (
                <motion.th
                  key={column.key}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
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
                  transition={{ delay: 0.1 + columns.length * 0.05 }}
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
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
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
                    className="table-row hover-lift mouse-shadow"
                    whileHover={{ scale: 1.01 }}
                  >
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
  );
};

export default DataTable;
