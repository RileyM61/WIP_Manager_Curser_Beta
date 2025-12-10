import React, { useState, useEffect } from 'react';
import { Job, ChangeOrder } from '../types';
import ChangeOrderList from './ChangeOrderList';
import ChangeOrderSummaryCard from './ChangeOrderSummaryCard';
import ChangeOrderFormModal from './modals/ChangeOrderFormModal';
import { useSupabaseChangeOrders } from '../hooks/useSupabaseChangeOrders';

interface ChangeOrderPanelProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job;
    companyId: string;
}

const ChangeOrderPanel: React.FC<ChangeOrderPanelProps> = ({
    isOpen,
    onClose,
    job,
    companyId,
}) => {
    const {
        changeOrders,
        loading,
        loadChangeOrders,
        addChangeOrder,
        updateChangeOrder,
        deleteChangeOrder,
        getNextCoNumber,
    } = useSupabaseChangeOrders(companyId);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [coToEdit, setCoToEdit] = useState<ChangeOrder | null>(null);
    const [nextCoNumber, setNextCoNumber] = useState(1);

    // Load change orders when panel opens
    useEffect(() => {
        if (isOpen && job.id) {
            loadChangeOrders(job.id);
        }
    }, [isOpen, job.id, loadChangeOrders]);

    // Get next CO number when opening form for new CO
    useEffect(() => {
        const fetchNextNumber = async () => {
            if (isOpen && job.id) {
                const nextNum = await getNextCoNumber(job.id);
                setNextCoNumber(nextNum);
            }
        };
        fetchNextNumber();
    }, [isOpen, job.id, changeOrders.length, getNextCoNumber]);

    const handleAddNew = () => {
        setCoToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (co: ChangeOrder) => {
        setCoToEdit(co);
        setIsFormOpen(true);
    };

    const handleSave = async (co: ChangeOrder) => {
        try {
            if (co.id) {
                await updateChangeOrder(co);
            } else {
                await addChangeOrder(co, job.id);
            }
            setIsFormOpen(false);
            setCoToEdit(null);
        } catch (err) {
            console.error('Error saving change order:', err);
            alert('Failed to save change order. Please try again.');
        }
    };

    const handleDelete = async (coId: string) => {
        try {
            await deleteChangeOrder(coId);
            setIsFormOpen(false);
            setCoToEdit(null);
        } catch (err) {
            console.error('Error deleting change order:', err);
            alert('Failed to delete change order. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                            Change Orders
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {job.jobName} ({job.jobNo})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Summary Card */}
                    <ChangeOrderSummaryCard
                        job={job}
                        changeOrders={changeOrders}
                    />

                    {/* Change Order List */}
                    <ChangeOrderList
                        changeOrders={changeOrders}
                        onEdit={handleEdit}
                        onAddNew={handleAddNew}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Change Order Form Modal */}
            <ChangeOrderFormModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setCoToEdit(null);
                }}
                onSave={handleSave}
                onDelete={handleDelete}
                coToEdit={coToEdit}
                jobId={job.id}
                nextCoNumber={coToEdit?.coNumber || nextCoNumber}
            />
        </>
    );
};

export default ChangeOrderPanel;
