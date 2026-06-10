import 'package:flutter/material.dart';

class SearchableDropdown<T> extends StatelessWidget {
  final List<T> items;
  final T? value;
  final String Function(T) itemAsString;
  final void Function(T?) onChanged;
  final String hint;

  const SearchableDropdown({
    super.key,
    required this.items,
    required this.value,
    required this.itemAsString,
    required this.onChanged,
    required this.hint,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _showSearchModal(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(color: const Color(0xFFE5E7EB)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                value != null ? itemAsString(value as T) : hint,
                style: TextStyle(
                  fontSize: 14,
                  color: value != null ? Colors.black87 : Colors.black54,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Icon(Icons.arrow_drop_down, color: Colors.black54),
          ],
        ),
      ),
    );
  }

  void _showSearchModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _SearchModal<T>(
        items: items,
        itemAsString: itemAsString,
        onSelected: (selected) {
          onChanged(selected);
          Navigator.pop(context);
        },
        hint: hint,
      ),
    );
  }
}

class _SearchModal<T> extends StatefulWidget {
  final List<T> items;
  final String Function(T) itemAsString;
  final void Function(T) onSelected;
  final String hint;

  const _SearchModal({
    required this.items,
    required this.itemAsString,
    required this.onSelected,
    required this.hint,
  });

  @override
  State<_SearchModal<T>> createState() => _SearchModalState<T>();
}

class _SearchModalState<T> extends State<_SearchModal<T>> {
  late List<T> filteredItems;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    filteredItems = widget.items;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filter(String query) {
    setState(() {
      if (query.isEmpty) {
        filteredItems = widget.items;
      } else {
        filteredItems = widget.items
            .where((item) => widget.itemAsString(item)
                .toLowerCase()
                .contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        top: 24,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(widget.hint, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchController,
              onChanged: _filter,
              decoration: InputDecoration(
                hintText: 'Cari ${widget.hint}...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: filteredItems.length,
                itemBuilder: (context, index) {
                  final item = filteredItems[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(widget.itemAsString(item)),
                    onTap: () => widget.onSelected(item),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
