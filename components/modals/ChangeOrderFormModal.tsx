import React, { useState, useEffect } from 'react';
import { ChangeOrder, ChangeOrderStatus, CostBreakdown, JobType, TMSettings, LaborBillingType } from '../../types';
import { CurrencyInput } from '../shared/CurrencyInput';
import { getDefaultTMSettings } from '../../modules/wip/lib/jobCalculations';

interface ChangeOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (co: ChangeOrder) => void;
    onDelete?: (coId: string) => void;
    coToEdit: ChangeOrder | null;
    jobId: string;
    nextCoNumber: number;
}

const ChangeOrderFormModal: React.FC<ChangeOrderFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    coToEdit,
    jobId,
    nextCoNumber,
}) => {
    const getInitialState = (): ChangeOrder => ({
        id: '',
        jobId,
        coNumber: nextCoNumber,
        description: '',
        coType: 'fixed-price',
        status: 'pending',
        contract: { labor: 0, material: 0, other: 0 },
        budget: { labor: 0, material: 0, other: 0 },
        costs: { labor: 0, material: 0, other: 0 },
        invoiced: { labor: 0, material: 0, other: 0 },
        costToComplete: { labor: 0, material: 0, other: 0 },
    });

    const [formData, setFormData] = useState<ChangeOrder>(getInitialState());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (coToEdit) {
                setFormData(coToEdit);
            } else {
                setFormData(getInitialState());
            }
            setShowDeleteConfirm(false);
        }
    }, [isOpen, coToEdit, jobId, nextCoNumber]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCOTypeChange = (newType: JobType) => {
        setFormData(prev => ({
            ...prev,
            coType: newType,
            tmSettings: newType === 'time-material' ? getDefaultTMSettings() : undefined,
        }));
    };

    const handleStatusChange = (newStatus: ChangeOrderStatus) => {
        const now = new Date().toISOString();
        let updates: Partial<ChangeOrder> = { status: newStatus };

        if (newStatus === 'approved' && formData.status !== 'approved') {
            updates.approvedDate = now;
        }
        if (newStatus === 'completed' && formData.status !== 'completed') {
            updates.completedDate = now;
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleCurrencyChange = (name: string, value: number) => {
        const parts = name.split('.');
        if (parts.length === 2) {
            const [section, field] = parts;
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section as keyof ChangeOrder] as CostBreakdown),
                    [field]: value,
                },
            }));
        }
    };

    const handleTMSettingChange = (field: keyof TMSettings, value: number | LaborBillingType) => {
        setFormData(prev => ({
            ...prev,
            tmSettings: {
                ...(prev.tmSettings || getDefaultTMSettings()),
                [field]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Set submitted date if pending and not already set
        const submittedCO = {
            ...formData,
            submittedDate: formData.submittedDate || new Date().toISOString(),
        };

        onSave(submittedCO);
        onClose();
    };

    const handleDelete = () => {
        if (onDelete && coToEdit?.id) {
            onDelete(coToEdit.id);
            onClose();
        }
    };

    const isTM = formData.coType === 'time-material';
    const isEditing = !!coToEdit;

    // Calculate totals
    const contractTotal = formData.contract.labor + formData.contract.material + formData.contract.other;
    const budgetTotal = formData.budget.labor + formData.budget.material + formData.budget.other;
    const costsTotal = formData.costs.labor + formData.costs.material + formData.costs.other;
    const invoicedTotal = formData.invoiced.labor + formData.invoiced.material + formData.invoiced.other;
    const costToCompleteTotal = formData.costToComplete.labor + formData.costToComplete.material + formData.costToComplete.other;

    // Calculate % complete using Costs / (Costs + CTC) methodology
    // This represents actual progress based on forecasted total costs
    const laborTotal = formData.costs.labor + formData.costToComplete.labor;
    const materialTotal = formData.costs.material + formData.costToComplete.material;
    const otherTotal = formData.costs.other + formData.costToComplete.other;

    const laborPctComplete = laborTotal > 0 ? formData.costs.labor / laborTotal : 0;
    const materialPctComplete = materialTotal > 0 ? formData.costs.material / materialTotal : 0;
    const otherPctComplete = otherTotal > 0 ? formData.costs.other / otherTotal : 0;

    // Calculate earned revenue using component-level % complete
    // Each component: Contract × (Cost / (Cost + CTC))
    const laborEarned = formData.contract.labor * laborPctComplete;
    const materialEarned = formData.contract.material * materialPctComplete;
    const otherEarned = formData.contract.other * otherPctComplete;
    const earnedRevenue = laborEarned + materialEarned + otherEarned;

    // Overall % complete for display
    const totalForecastedCost = costsTotal + costToCompleteTotal;
    const percentComplete = totalForecastedCost > 0 ? Math.min((costsTotal / totalForecastedCost) * 100, 100) : 0;

    // Over/Under billed = Invoiced - Earned
    const overUnderBilled = invoicedTotal - earnedRevenue;

    // Helper to format markup as percentage for display
    const markupToPercent = (markup: number) => ((markup - 1) * 100).toFixed(0);
    const percentToMarkup = (percent: number) => 1 + (percent / 100);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        {isEditing ? `Edit CO-${String(formData.coNumber).padStart(3, '0')}` : `New Change Order (CO-${String(nextCoNumber).padStart(3, '0')})`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="Describe the change order..."
                        />
                    </div>

                    {/* CO Type & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                CO Type
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCOTypeChange('fixed-price')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!isTM
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    Fixed Price
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCOTypeChange('time-material')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isTM
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    T&M
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleStatusChange(e.target.value as ChangeOrderStatus)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${formData.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            formData.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                formData.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                            {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                        </span>
                        {formData.approvedDate && (
                            <span className="text-slate-500 dark:text-slate-400">
                                Approved: {new Date(formData.approvedDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* T&M Settings (only for T&M COs) */}
                    {isTM && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">T&M Settings</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400">Labor Bill Rate ($/hr)</label>
                                    <input
                                        type="number"
                                        value={formData.tmSettings?.laborBillRate || ''}
                                        onChange={(e) => handleTMSettingChange('laborBillRate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400">Material Markup (%)</label>
                                    <input
                                        type="number"
                                        value={formData.tmSettings?.materialMarkup ? markupToPercent(formData.tmSettings.materialMarkup) : '15'}
                                        onChange={(e) => handleTMSettingChange('materialMarkup', percentToMarkup(parseFloat(e.target.value) || 0))}
                                        className="w-full px-2 py-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400">Other Markup (%)</label>
                                    <input
                                        type="number"
                                        value={formData.tmSettings?.otherMarkup ? markupToPercent(formData.tmSettings.otherMarkup) : '10'}
                                        onChange={(e) => handleTMSettingChange('otherMarkup', percentToMarkup(parseFloat(e.target.value) || 0))}
                                        className="w-full px-2 py-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Inputs */}
                    <div className="space-y-3">
                        {/* Column Headers */}
                        <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            <div></div>
                            <div className="text-center">Labor</div>
                            <div className="text-center">Material</div>
                            <div className="text-center">Other</div>
                        </div>

                        {/* Contract */}
                        <div className="grid grid-cols-4 gap-2 items-center">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contract</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatCurrency(contractTotal)}</span>
                            </div>
                            <CurrencyInput
                                name="contract.labor"
                                value={formData.contract.labor}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="contract.material"
                                value={formData.contract.material}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="contract.other"
                                value={formData.contract.other}
                                onChange={handleCurrencyChange}
                            />
                        </div>

                        {/* Budget */}
                        <div className="grid grid-cols-4 gap-2 items-center">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Budget</span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatCurrency(budgetTotal)}</span>
                            </div>
                            <CurrencyInput
                                name="budget.labor"
                                value={formData.budget.labor}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="budget.material"
                                value={formData.budget.material}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="budget.other"
                                value={formData.budget.other}
                                onChange={handleCurrencyChange}
                            />
                        </div>

                        {/* Costs To Date */}
                        <div className="grid grid-cols-4 gap-2 items-center">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Costs</span>
                                <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatCurrency(costsTotal)}</span>
                            </div>
                            <CurrencyInput
                                name="costs.labor"
                                value={formData.costs.labor}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="costs.material"
                                value={formData.costs.material}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="costs.other"
                                value={formData.costs.other}
                                onChange={handleCurrencyChange}
                            />
                        </div>

                        {/* Invoiced */}
                        <div className="grid grid-cols-4 gap-2 items-center">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Invoiced</span>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">{formatCurrency(invoicedTotal)}</span>
                            </div>
                            <CurrencyInput
                                name="invoiced.labor"
                                value={formData.invoiced.labor}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="invoiced.material"
                                value={formData.invoiced.material}
                                onChange={handleCurrencyChange}
                            />
                            <CurrencyInput
                                name="invoiced.other"
                                value={formData.invoiced.other}
                                onChange={handleCurrencyChange}
                            />
                        </div>

                        {/* Cost to Complete - Fixed Price Only */}
                        {!isTM && (
                            <div className="grid grid-cols-4 gap-2 items-center">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">CTC</span>
                                    <span className="text-xs font-bold text-wip-gold-dark dark:text-wip-gold">{formatCurrency(costToCompleteTotal)}</span>
                                </div>
                                <CurrencyInput
                                    name="costToComplete.labor"
                                    value={formData.costToComplete.labor}
                                    onChange={handleCurrencyChange}
                                />
                                <CurrencyInput
                                    name="costToComplete.material"
                                    value={formData.costToComplete.material}
                                    onChange={handleCurrencyChange}
                                />
                                <CurrencyInput
                                    name="costToComplete.other"
                                    value={formData.costToComplete.other}
                                    onChange={handleCurrencyChange}
                                />
                            </div>
                        )}
                    </div>

                    {/* Over/Under Billed Display */}
                    {!isTM && budgetTotal > 0 && (
                        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
                            <div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">% Complete: </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{percentComplete.toFixed(0)}%</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 ml-3">Earned: </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(earnedRevenue)}</span>
                            </div>
                            <div className={`text-lg font-bold ${overUnderBilled >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {overUnderBilled >= 0 ? 'Over' : 'Under'} Billed: {formatCurrency(Math.abs(overUnderBilled))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-4 border-t dark:border-slate-700">
                        {isEditing && onDelete ? (
                            showDeleteConfirm ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-red-600 dark:text-red-400">Delete this CO?</span>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-3 py-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                                    >
                                        No
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    Delete
                                </button>
                            )
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                {isEditing ? 'Update' : 'Create'} Change Order
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangeOrderFormModal;
