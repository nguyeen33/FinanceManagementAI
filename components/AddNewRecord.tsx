'use client';
import { useRef, useState } from 'react';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { suggestCategory } from '@/app/actions/suggestCategory';
import uploadExpenseFile from '@/app/actions/uploadExpenseFile';

const AddRecord = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState(50); // Default value for expense amount
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // State for alert message
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null); // State for alert type
  const [isLoading, setIsLoading] = useState(false); // State for loading spinner
  const [category, setCategory] = useState(''); // State for selected expense category
  const [description, setDescription] = useState(''); // State for expense description
  const [isCategorizingAI, setIsCategorizingAI] = useState(false); // State for AI categorization loading
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // State for uploaded file (receipt, bill, etc.)
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const clientAction = async (formData: FormData) => {
    setIsLoading(true); 
    setAlertMessage(null); 

    formData.set('amount', amount.toString()); 
    formData.set('category', category); 

    const { error } = await addExpenseRecord(formData); 

    if (error) {
      setAlertMessage(`Error: ${error}`);
      setAlertType('error'); 
    } else {
      setAlertMessage('Expense record added successfully!');
      setAlertType('success'); // Set alert type to success
      formRef.current?.reset();
      setAmount(50); // Reset the amount to the default value
      setCategory(''); // Reset the category
      setDescription(''); // Reset the description
    }

    setIsLoading(false); // Hide spinner
  };

  const handleAISuggestCategory = async () => {
    if (!description.trim()) {
      setAlertMessage('Please enter a description first');
      setAlertType('error');
      return;
    }

    setIsCategorizingAI(true);
    setAlertMessage(null);

    try {
      const result = await suggestCategory(description);
      if (result.error) {
        setAlertMessage(`AI Suggestion: ${result.error}`);
        setAlertType('error');
      } else {
        setCategory(result.category);
        setAlertMessage(`AI suggested category: ${result.category}`);
        setAlertType('success');
      }
    } catch {
      setAlertMessage('Failed to get AI category suggestion');
      setAlertType('error');
    } finally {
      setIsCategorizingAI(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsUploadingFile(true);
    setAlertMessage(null);

    try {
      const data = new FormData();
      data.append('receipt', file);
      if (description) data.append('description', description);
      if (category) data.append('category', category);

      const result = await uploadExpenseFile(data);

      if (!result.success) {
        setAlertMessage(result.message);
        setAlertType('error');
      } else {
        setAlertMessage(result.message);
        setAlertType('success');
        formRef.current?.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploadedFile(null);
        setAmount(50);
        setCategory('');
        setDescription('');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setAlertMessage('Failed to process the uploaded file.');
      setAlertType('error');
    } finally {
      setIsUploadingFile(false);
    }
  };

  return (
    <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl'>
      <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
        <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg'>
          <span className='text-white text-sm sm:text-lg'>💳</span>
        </div>
        <div>
          <h3 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight'>
            Add New Expense
          </h3>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
            Track your spending with AI assistance
          </p>
        </div>
      </div>
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(formRef.current!);
          clientAction(formData);
        }}
        className='space-y-6 sm:space-y-8'
      >
        {/* Expense Description and Date */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/50'>
          {/* Expense Description */}
          <div className='space-y-1.5'>
            <label
              htmlFor='text'
              className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'
            >
              <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></span>
              Expense Description
            </label>
            <div className='relative'>
              <input
                type='text'
                id='text'
                name='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='w-full pl-3 pr-12 sm:pr-14 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:bg-white dark:focus:bg-gray-700/90 focus:border-emerald-400 dark:focus:border-emerald-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm shadow-sm hover:shadow-md transition-all duration-200'
                placeholder='Coffee, groceries, gas...'
                required
              />
              <button
                type='button'
                onClick={handleAISuggestCategory}
                disabled={isCategorizingAI || !description.trim()}
                className='absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-7 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg text-xs font-medium flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200'
                title='AI Category Suggestion'
              >
                {isCategorizingAI ? (
                  <div className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                ) : (
                  <span className='text-xs'>✨</span>
                )}
              </button>
            </div>
            {isCategorizingAI && (
              <div className='flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400'>
                <div className='w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse'></div>
                AI is analyzing your description...
              </div>
            )}
          </div>

          {/* Expense Date */}
          <div className='space-y-1.5'>
            <label
              htmlFor='date'
              className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'
            >
              <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
              Expense Date
            </label>
            <input
              type='date'
              name='date'
              id='date'
              className='w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:bg-white dark:focus:bg-gray-700/90 focus:border-emerald-400 dark:focus:border-emerald-400 text-gray-900 dark:text-gray-100 text-sm shadow-sm hover:shadow-md transition-all duration-200'
              required
              onFocus={(e) => e.target.showPicker()}
            />
          </div>
        </div>

        {/* Category Selection, Amount and Upload */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-100/50 dark:border-green-800/50'>
          {/* Category Selection */}
          <div className='space-y-1.5'>
            <label
              htmlFor='category'
              className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'
            >
              <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
              Category
              <span className='text-xs text-gray-400 dark:text-gray-500 ml-2 font-normal hidden sm:inline'>
                Use the ✨ button above for AI suggestions
              </span>
            </label>
            <select
              id='category'
              name='category'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:bg-white dark:focus:bg-gray-700/90 focus:border-emerald-400 dark:focus:border-emerald-400 text-gray-900 dark:text-gray-100 cursor-pointer text-sm shadow-sm hover:shadow-md transition-all duration-200'
              required
            >
              <option
                value=''
                disabled
                className='text-gray-400 dark:text-gray-500'
              >
                Select category...
              </option>
              <option value='Food' className='text-gray-900 dark:text-gray-100'>
                🍔 Food & Dining
              </option>
              <option
                value='Transportation'
                className='text-gray-900 dark:text-gray-100'
              >
                🚗 Transportation
              </option>
              <option
                value='Shopping'
                className='text-gray-900 dark:text-gray-100'
              >
                🛒 Shopping
              </option>
              <option
                value='Entertainment'
                className='text-gray-900 dark:text-gray-100'
              >
                🎬 Entertainment
              </option>
              <option
                value='Bills'
                className='text-gray-900 dark:text-gray-100'
              >
                💡 Bills & Utilities
              </option>
              <option
                value='Healthcare'
                className='text-gray-900 dark:text-gray-100'
              >
                🏥 Healthcare
              </option>
              <option
                value='Other'
                className='text-gray-900 dark:text-gray-100'
              >
                📦 Other
              </option>
            </select>
          </div>

          {/* Amount */}
          <div className='space-y-1.5'>
            <label
              htmlFor='amount'
              className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'
            >
              <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
              Amount
              <span className='text-xs text-gray-400 dark:text-gray-500 ml-2 font-normal hidden sm:inline'>
                Enter amount above $0 or any amount up to $1.000.000
              </span>
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm'>
                $
              </span>
              <input
                type='number'
                name='amount'
                id='amount'
                min='0'
                max='1000000'
                step='0.1'
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className='w-full pl-6 pr-3 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:bg-white dark:focus:bg-gray-700/90 focus:border-emerald-400 dark:focus:border-emerald-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200'
                placeholder='0.00'
                required
              />
            </div>
          </div>

          {/* Upload File (receipt, bill, CSV) */}
          <div className='space-y-1.5'>
            <label
              htmlFor='receipt'
              className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'
            >
              <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
              Upload File
              <span className='text-xs text-gray-400 dark:text-gray-500 ml-2 font-normal hidden sm:inline'>
                Optional: You may upload bill image, PDF, or CSV
              </span>
            </label>
            <input
              type='file'
              id='receipt'
              name='receipt'
              accept='.csv,application/pdf,image/*'
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setUploadedFile(file);
                if (file) {
                  handleUploadFile(file);
                }
              }}
              className='block w-full text-xs text-gray-500 dark:text-gray-400
                         file:mr-3 file:py-2.5 file:px-4
                         file:rounded-xl file:border-0
                         file:text-xs file:font-semibold
                         file:bg-emerald-50 file:text-emerald-700
                         hover:file:bg-emerald-100
                         bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all duration-200'
            />
            {uploadedFile && (
              <p className='text-[11px] text-gray-500 dark:text-gray-400'>
                {isUploadingFile ? 'Uploading:' : 'Selected:'}{' '}
                <span className='font-medium'>{uploadedFile.name}</span>
              </p>
            )}
            <p className='text-[11px] text-gray-400 dark:text-gray-500'>
              The file will be scanned to detect totals automatically after selection.
            </p>
            {isUploadingFile && (
              <p className='text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
                <span className='inline-block w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin'></span>
                Parsing file...
              </p>
            )}
            <p className='text-[11px] text-gray-400 dark:text-gray-500 mt-1'>
              Works with receipts, invoices, PDFs, and CSV exports.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          className='w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 hover:from-emerald-700 hover:via-green-600 hover:to-teal-600 text-white px-4 py-3 sm:px-5 sm:py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl group transition-all duration-300 border-2 border-transparent hover:border-white/20 text-sm sm:text-base'
          disabled={isLoading}
        >
          <div className='relative flex items-center justify-center gap-2'>
            {isLoading ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className='text-lg'>💫</span>
                <span>Add Expense</span>
              </>
            )}
          </div>
        </button>
      </form>

      {/* Alert Message */}
      {alertMessage && (
        <div
          className={`mt-4 p-3 rounded-xl border-l-4 backdrop-blur-sm ${
            alertType === 'success'
              ? 'bg-green-50/80 dark:bg-green-900/20 border-l-green-500 text-green-800 dark:text-green-200'
              : 'bg-red-50/80 dark:bg-red-900/20 border-l-red-500 text-red-800 dark:text-red-200'
          }`}
        >
          <div className='flex items-center gap-2'>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                alertType === 'success'
                  ? 'bg-green-100 dark:bg-green-800'
                  : 'bg-red-100 dark:bg-red-800'
              }`}
            >
              <span className='text-sm'>
                {alertType === 'success' ? '✅' : '⚠️'}
              </span>
            </div>
            <p className='font-medium text-sm'>{alertMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddRecord;
