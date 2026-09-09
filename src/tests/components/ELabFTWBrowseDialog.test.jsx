import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import $ from 'jquery';
import { toast } from 'react-toastify';
import ELabFTWBrowseDialog from '../../components/ELabFTWBrowseDialog';

const findAjaxCall = (url) => {
  const calls = $.ajax.mock.calls.map(([options]) => options).filter((options) => options.url === url);
  return calls[calls.length - 1];
};

describe('ELabFTWBrowseDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates Category -> Item -> Uploads and selects a file carrying the item it actually came from', () => {
    const onSelectFileMock = vi.fn();
    const setOpenMock = vi.fn();

    render(
      <ELabFTWBrowseDialog
        open={true}
        setOpen={setOpenMock}
        eLabURL="https://elab.example.com"
        token="test-token"
        onSelectFile={onSelectFileMock}
      />
    );

    // Level 0: categories load automatically on open
    const categoriesCall = findAjaxCall('/api/elab/categories_list');
    expect(categoriesCall).toBeDefined();
    act(() => {
      categoriesCall.success({
        status: 200,
        categories: [{ id: 7, title: 'Instruments', color: '29aeb9' }],
      });
    });

    expect(screen.getByText('All items')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    expect(screen.getByText('Instruments')).toBeInTheDocument();

    // Level 1: items in the clicked category
    fireEvent.click(screen.getByText('Instruments'));
    const itemsCall = findAjaxCall('/api/elab/items_list');
    expect(itemsCall).toBeDefined();
    expect(itemsCall.data.categoryId).toBe(7);
    act(() => {
      itemsCall.success({
        status: 200,
        items: [{ id: 42, title: 'SEM schemas' }],
        truncated: false,
      });
    });

    expect(screen.getByText('SEM schemas')).toBeInTheDocument();

    // Level 2: uploads in the clicked item
    fireEvent.click(screen.getByText('SEM schemas'));
    const uploadsCall = findAjaxCall('/api/elab/item_uploads');
    expect(uploadsCall).toBeDefined();
    expect(uploadsCall.data.itemId).toBe(42);
    act(() => {
      uploadsCall.success({
        status: 200,
        entries: [{ id: 99, name: 'demo_01.json' }],
      });
    });

    expect(screen.getByText('demo_01.json')).toBeInTheDocument();

    // Selecting a file must carry the id of the item it was actually browsed from,
    // not a stale/shared item id from elsewhere in the app
    fireEvent.click(screen.getByText('demo_01.json'));
    expect(onSelectFileMock).toHaveBeenCalledWith({ id: 99, name: 'demo_01.json', itemId: 42 });
    expect(setOpenMock).toHaveBeenCalledWith(false);
  });

  it('breadcrumb click back to a category re-lists its items and drops the deeper uploads view', () => {
    render(
      <ELabFTWBrowseDialog
        open={true}
        setOpen={vi.fn()}
        eLabURL="https://elab.example.com"
        token="test-token"
        onSelectFile={vi.fn()}
      />
    );

    act(() => {
      findAjaxCall('/api/elab/categories_list').success({
        status: 200,
        categories: [{ id: 7, title: 'Instruments', color: '29aeb9' }],
      });
    });

    fireEvent.click(screen.getByText('Instruments'));
    act(() => {
      findAjaxCall('/api/elab/items_list').success({
        status: 200,
        items: [{ id: 42, title: 'SEM schemas' }],
      });
    });

    fireEvent.click(screen.getByText('SEM schemas'));
    act(() => {
      findAjaxCall('/api/elab/item_uploads').success({
        status: 200,
        entries: [{ id: 99, name: 'demo_01.json' }],
      });
    });

    expect(screen.getByText('demo_01.json')).toBeInTheDocument();

    // now at the uploads level; click the "Instruments" breadcrumb to go back to its items
    fireEvent.click(screen.getByText('Instruments'));

    const itemsCalls = $.ajax.mock.calls
      .map(([options]) => options)
      .filter((options) => options.url === '/api/elab/items_list');
    expect(itemsCalls.length).toBe(2);
    act(() => {
      itemsCalls[1].success({ status: 200, items: [{ id: 42, title: 'SEM schemas' }] });
    });

    expect(screen.getByText('SEM schemas')).toBeInTheDocument();
    expect(screen.queryByText('demo_01.json')).not.toBeInTheDocument();
  });

  it('still offers "All items" and "Uncategorized" even when the real category list fails to load', () => {
    render(
      <ELabFTWBrowseDialog
        open={true}
        setOpen={vi.fn()}
        eLabURL="https://elab.example.com"
        token="test-token"
        onSelectFile={vi.fn()}
      />
    );

    act(() => {
      findAjaxCall('/api/elab/categories_list').error();
    });

    expect(toast.error).toHaveBeenCalled();
    expect(screen.getByText('All items')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });
});
