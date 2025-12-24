import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../data/repositories/mock_dashboard_repository.dart';

class SearchFilterModal extends StatefulWidget {
  final TextEditingController searchController;
  final String? selectedType;
  final String? selectedState;
  final String? selectedAffiliation;
  final String? selectedBoard;
  final String? selectedStrength;
  final Function(String?) onTypeChanged;
  final Function(String?) onStateChanged;
  final Function(String?) onAffiliationChanged;
  final Function(String?) onBoardChanged;
  final Function(String?) onStrengthChanged;
  final VoidCallback onClearFilters;
  final VoidCallback onApplyFilters;

  const SearchFilterModal({
    super.key,
    required this.searchController,
    required this.selectedType,
    required this.selectedState,
    required this.selectedAffiliation,
    required this.selectedBoard,
    required this.selectedStrength,
    required this.onTypeChanged,
    required this.onStateChanged,
    required this.onAffiliationChanged,
    required this.onBoardChanged,
    required this.onStrengthChanged,
    required this.onClearFilters,
    required this.onApplyFilters,
  });

  @override
  State<SearchFilterModal> createState() => _SearchFilterModalState();
}

class _SearchFilterModalState extends State<SearchFilterModal> {
  final _repository = MockDashboardRepository();
  
  // Local state for filter selections
  late String? _selectedType;
  late String? _selectedState;
  late String? _selectedAffiliation;
  late String? _selectedBoard;
  late String? _selectedStrength;

  @override
  void initState() {
    super.initState();
    // Initialize with current values from parent
    _selectedType = widget.selectedType;
    _selectedState = widget.selectedState;
    _selectedAffiliation = widget.selectedAffiliation;
    _selectedBoard = widget.selectedBoard;
    _selectedStrength = widget.selectedStrength;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: AppColors.borderDark.withValues(alpha: 0.2),
                ),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  'Search & Filters',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: AppColors.textSecondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Scrollable content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search bar
                  TextField(
                    controller: widget.searchController,
                    decoration: InputDecoration(
                      hintText: 'Search institutions by name or city...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                      suffixIcon: widget.searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 20),
                              onPressed: () {
                                widget.searchController.clear();
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: AppColors.borderDark.withValues(alpha: 0.3),
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: AppColors.borderDark.withValues(alpha: 0.3),
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                      filled: true,
                      fillColor: AppColors.background,
                    ),
                    onChanged: (value) => setState(() {}),
                  ),

                  const SizedBox(height: 24),
                  const Text(
                    'Filters',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Filter Row 1: Institution Type & State
                  Row(
                    children: [
                      Expanded(
                        child: _buildLabeledFilter(
                          label: 'Institution Type',
                          value: _selectedType,
                          items: _repository.getInstitutionTypes(),
                          onChanged: (value) {
                            setState(() => _selectedType = value);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildLabeledFilter(
                          label: 'State',
                          value: _selectedState,
                          items: _repository.getStates(),
                          onChanged: (value) {
                            setState(() => _selectedState = value);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Filter Row 2: Board & Affiliation Type
                  Row(
                    children: [
                      Expanded(
                        child: _buildLabeledFilter(
                          label: 'Board',
                          value: _selectedBoard,
                          items: _repository.getBoards(),
                          onChanged: (value) {
                            setState(() => _selectedBoard = value);
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildLabeledFilter(
                          label: 'Affiliation Type',
                          value: _selectedAffiliation,
                          items: _repository.getAffiliations(),
                          onChanged: (value) {
                            setState(() => _selectedAffiliation = value);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Filter Row 3: Student Strength (full width)
                  _buildLabeledFilter(
                    label: 'Student Strength',
                    value: _selectedStrength,
                    items: _repository.getStudentStrengths(),
                    onChanged: (value) {
                      setState(() => _selectedStrength = value);
                    },
                  ),
                ],
              ),
            ),
          ),

          // Bottom action buttons
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(
                top: BorderSide(
                  color: AppColors.borderDark.withValues(alpha: 0.2),
                ),
              ),
            ),
            child: Row(
              children: [
                if (_selectedType != null ||
                    _selectedState != null ||
                    _selectedBoard != null ||
                    _selectedAffiliation != null ||
                    _selectedStrength != null ||
                    widget.searchController.text.isNotEmpty)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _selectedType = null;
                          _selectedState = null;
                          _selectedBoard = null;
                          _selectedAffiliation = null;
                          _selectedStrength = null;
                          widget.searchController.clear();
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Clear All'),
                    ),
                  ),
                if (_selectedType != null ||
                    _selectedState != null ||
                    _selectedBoard != null ||
                    _selectedAffiliation != null ||
                    _selectedStrength != null ||
                    widget.searchController.text.isNotEmpty)
                  const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      // Pass all selected values to parent callbacks
                      widget.onTypeChanged(_selectedType);
                      widget.onStateChanged(_selectedState);
                      widget.onBoardChanged(_selectedBoard);
                      widget.onAffiliationChanged(_selectedAffiliation);
                      widget.onStrengthChanged(_selectedStrength);
                      
                      // Apply filters and close modal
                      widget.onApplyFilters();
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Apply Filters',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabeledFilter({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: value != null 
                  ? AppColors.primary.withValues(alpha: 0.5)
                  : AppColors.borderDark.withValues(alpha: 0.3),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              hint: Text(
                label,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
              isExpanded: true,
              icon: const Icon(Icons.arrow_drop_down, color: AppColors.primary, size: 24),
              dropdownColor: AppColors.cardBackground,
              items: items.map((item) {
                return DropdownMenuItem(
                  value: item,
                  child: Text(
                    item,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                    ),
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }
}
