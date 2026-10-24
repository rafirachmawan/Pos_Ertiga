import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { showConfirm, showAlert, showToast } from '../lib/dialog';

// Helper: Format number to "Rp X.XXX"
const formatRupiah = (number) => {
  if (!number && number !== 0) return '';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Helper: Remove non-numeric characters for raw value
const parseRupiah = (str) => {
  return Number(str.replace(/[^0-9]/g, ''));
};

const DEFAULT_FORM_DATA = {
  id: null,
  barcode: '',
  nama_barang: '',
  harga_modal: 0,
  harga_jual: 0,
  stok: 0,
  satuan: 'pcs',
  gambar: '',
  galeri_gambar: [],
  kategori_id: '',
  berat_gram: 200,
  tampil_online: 1,
  deskripsi: '',
  kondisi: 'Baru',
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [barcodeSortOrder, setBarcodeSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const ITEMS_PER_PAGE = 5;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isQuickImageModalOpen, setIsQuickImageModalOpen] = useState(false);
  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' | 'url'
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Barcode prefix & number states
  const [barcodePrefix, setBarcodePrefix] = useState('');
  const [barcodeNumber, setBarcodeNumber] = useState('');
  const [isManualBarcode, setIsManualBarcode] = useState(false);

  // Restock & Quick Adjust states
  const [restockData, setRestockData] = useState({ barang_id: null, qty: 1, keterangan: '' });
  const [quickStockTarget, setQuickStockTarget] = useState(null);
  const [quickStockNewValue, setQuickStockNewValue] = useState(0);

  // Quick Image target
  const [quickImageTarget, setQuickImageTarget] = useState(null);
  const [quickImageUrl, setQuickImageUrl] = useState('');

  // Display strings for inputs
  const [displayHargaModal, setDisplayHargaModal] = useState('');
  const [displayHargaJual, setDisplayHargaJual] = useState('');

  const fetchItems = async () => {
    try {
      const data = await api(`/api/barang${showInactive ? '?semua=1' : ''}`);
      if (data.data) setItems(data.data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchItems();
    api('/api/kategori')
      .then((d) => {
        if (d.data) setKategoriList(d.data);
      })
      .catch(console.error);
  }, [showInactive]);

  const handleCurrencyChange = (e, field) => {
    const rawValue = parseRupiah(e.target.value);
    setFormData({ ...formData, [field]: rawValue });
    if (field === 'harga_modal') setDisplayHargaModal(formatRupiah(rawValue));
    if (field === 'harga_jual') setDisplayHargaJual(formatRupiah(rawValue));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'kategori_id') {
      const catId = Number(value);
      const cat = (kategoriList || []).find((k) => k.id === catId);
      const catKode = cat?.kode ? cat.kode.trim().toUpperCase() : '';
      setBarcodePrefix(catKode);
      const newBarcode = catKode ? `${catKode}${barcodeNumber}` : (barcodeNumber || '');
      setFormData((prev) => ({
        ...prev,
        kategori_id: value,
        barcode: isManualBarcode ? prev.barcode : newBarcode,
      }));
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleBarcodeNumberChange = (e) => {
    const rawVal = e.target.value.replace(/\s+/g, '');
    setBarcodeNumber(rawVal);
    const newBarcode = barcodePrefix ? `${barcodePrefix}${rawVal}` : rawVal;
    setFormData((prev) => ({
      ...prev,
      barcode: newBarcode,
    }));
  };

  // Image compression
  const compressImage = (file, maxSize = 900, quality = 0.82) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Gambar tidak dapat dibaca'));
      };

      image.src = objectUrl;
    });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setFormData((current) => ({ ...current, gambar: compressed }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setQuickImageUrl(compressed);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGalleryFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentGallery = [...(formData.galeri_gambar || [])];
    const maxGalleryImages = 8;
    const remainingSlots = maxGalleryImages - currentGallery.length;
    if (remainingSlots <= 0) {
      alert(`Maksimal ${maxGalleryImages} foto galeri sudah tercapai.`);
      e.target.value = '';
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    try {
      const compressedList = await Promise.all(
        filesToUpload.map((f) => compressImage(f, 900, 0.82))
      );
      setFormData((prev) => ({
        ...prev,
        galeri_gambar: [...(prev.galeri_gambar || []), ...compressedList],
      }));
    } catch (err) {
      alert('Gagal memproses gambar: ' + (err.message || 'Error'));
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = formData.id ? `/api/barang/${formData.id}` : '/api/barang';
    const method = formData.id ? 'PUT' : 'POST';

    // If using URL mode and input is filled
    const finalPayload = { ...formData };
    if (imageInputMode === 'url' && imageUrlInput.trim()) {
      finalPayload.gambar = imageUrlInput.trim();
    }

    if (!finalPayload.barcode || !finalPayload.barcode.trim()) {
      alert('Kode Barang / SKU wajib diisi');
      return;
    }

    try {
      await api(url, { method, body: finalPayload });
      closeModal();
      fetchItems();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  const editItem = (item) => {
    // Parse galeri_gambar from JSON string to array
    let parsedGaleri = [];
    try {
      if (typeof item.galeri_gambar === 'string' && item.galeri_gambar.trim()) {
        parsedGaleri = JSON.parse(item.galeri_gambar);
        if (!Array.isArray(parsedGaleri)) parsedGaleri = [];
      } else if (Array.isArray(item.galeri_gambar)) {
        parsedGaleri = item.galeri_gambar;
      }
    } catch { parsedGaleri = []; }

    setFormData({
      ...item,
      berat_gram: item.berat_gram ?? 200,
      tampil_online: item.tampil_online !== undefined ? item.tampil_online : 1,
      deskripsi: item.deskripsi || '',
      kondisi: item.kondisi || 'Baru',
      galeri_gambar: parsedGaleri,
    });
    setDisplayHargaModal(formatRupiah(item.harga_modal));
    setDisplayHargaJual(formatRupiah(item.harga_jual));
    setImageUrlInput(item.gambar && item.gambar.startsWith('http') ? item.gambar : '');
    setImageInputMode(item.gambar && item.gambar.startsWith('http') ? 'url' : 'upload');

    // Parse barcode prefix and number
    const code = String(item.barcode || '').trim();
    const categoriesWithCodes = (kategoriList || [])
      .filter((k) => k.kode && k.kode.trim())
      .sort((a, b) => b.kode.length - a.kode.length);

    let foundPrefix = null;
    const cat = (kategoriList || []).find((k) => k.id === item.kategori_id);
    if (cat?.kode && code.startsWith(cat.kode)) {
      foundPrefix = cat.kode;
    } else {
      const match = categoriesWithCodes.find((k) => code.startsWith(k.kode));
      if (match) foundPrefix = match.kode;
    }

    if (foundPrefix) {
      setBarcodePrefix(foundPrefix);
      setBarcodeNumber(code.slice(foundPrefix.length));
      setIsManualBarcode(false);
    } else {
      setBarcodePrefix('');
      setBarcodeNumber(code);
      setIsManualBarcode(true);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setFormData(DEFAULT_FORM_DATA);
    setDisplayHargaModal('');
    setDisplayHargaJual('');
    setImageUrlInput('');
    setBarcodePrefix('');
    setBarcodeNumber('');
    setIsManualBarcode(false);
    setIsModalOpen(false);
  };

  const openRestockModal = (item) => {
    setRestockData({ barang_id: item.id, qty: 1, keterangan: `Restock ${item.nama_barang}` });
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await api('/api/stok-masuk', { method: 'POST', body: restockData });
      setIsRestockModalOpen(false);
      fetchItems();
      alert('Stok berhasil ditambahkan!');
    } catch (err) {
      alert('Gagal menambah stok: ' + err.message);
    }
  };

  // Quick Stock Adjustment
  const openQuickStockModal = (item) => {
    setQuickStockTarget(item);
    setQuickStockNewValue(Number(item.stok) || 0);
    setIsQuickStockModalOpen(true);
  };

  const handleQuickStockSave = async (e) => {
    e.preventDefault();
    if (!quickStockTarget) return;

    try {
      await api(`/api/barang/${quickStockTarget.id}`, {
        method: 'PUT',
        body: {
          ...quickStockTarget,
          stok: Number(quickStockNewValue),
        },
      });
      setIsQuickStockModalOpen(false);
      fetchItems();
    } catch (err) {
      alert('Gagal mengubah stok: ' + err.message);
    }
  };

  // Quick Image Modal
  const openQuickImageModal = (item) => {
    setQuickImageTarget(item);
    setQuickImageUrl(item.gambar || '');
    setIsQuickImageModalOpen(true);
  };

  const handleQuickImageSave = async (e) => {
    e.preventDefault();
    if (!quickImageTarget) return;

    try {
      await api(`/api/barang/${quickImageTarget.id}`, {
        method: 'PUT',
        body: {
          ...quickImageTarget,
          gambar: quickImageUrl,
        },
      });
      setIsQuickImageModalOpen(false);
      fetchItems();
    } catch (err) {
      alert('Gagal mengupdate gambar: ' + err.message);
    }
  };

  // Toggle Tampil Online
  const toggleTampilOnline = async (item) => {
    const newStatus = Number(item.tampil_online) === 1 ? 0 : 1;
    try {
      await api(`/api/barang/${item.id}`, {
        method: 'PUT',
        body: {
          ...item,
          tampil_online: newStatus,
        },
      });
      fetchItems();
    } catch (err) {
      alert('Gagal mengubah status online: ' + err.message);
    }
  };

  const deleteItem = async (id, namaBarang = '') => {
    const target = namaBarang ? ` "${namaBarang}"` : '';
    const ok = await showConfirm({
      title: 'Hapus Barang',
      message: `Yakin ingin menghapus barang${target}?`,
      submessage: 'Barang yang dihapus akan dipindahkan ke daftar nonaktif.',
      confirmText: 'Ya, Hapus Barang',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!ok) return;

    try {
      const result = await api(`/api/barang/${id}`, { method: 'DELETE' });
      showToast(result.message || 'Barang berhasil dihapus', 'success');
      fetchItems();
    } catch (err) {
      showAlert({ title: 'Gagal Menghapus', message: err.message, type: 'danger' });
    }
  };

  const restoreItem = async (id) => {
    try {
      await api(`/api/barang/${id}/restore`, { method: 'POST' });
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered Items by Search & Category and sorted by barcode
  const filteredItems = useMemo(() => {
    const list = items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.nama_barang || '').toLowerCase().includes(q) ||
        (item.barcode || '').toLowerCase().includes(q);

      const matchCat =
        !selectedFilterCategory ||
        String(item.kategori_id) === String(selectedFilterCategory);

      return matchSearch && matchCat;
    });

    list.sort((a, b) => {
      const codeA = String(a.barcode || '');
      const codeB = String(b.barcode || '');
      const cmp = codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
      return barcodeSortOrder === 'desc' ? -cmp : cmp;
    });

    return list;
  }, [items, searchQuery, selectedFilterCategory, barcodeSortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilterCategory, showInactive, barcodeSortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const actionBtn = {
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: '600',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
    transition: 'all 0.15s ease',
  };

  return (
    <div>
      {/* 1. Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Kelola Barang & Produk
          </h2>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '13px' }}>
            Atur inventaris stok, foto produk, harga, dan sinkronisasi ke katalog website toko online
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            color: '#64748B',
            cursor: 'pointer',
            fontWeight: '600',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
            />
            Tampilkan nonaktif
          </label>

          <button
            onClick={() => {
              setFormData(DEFAULT_FORM_DATA);
              setDisplayHargaModal('');
              setDisplayHargaJual('');
              setImageUrlInput('');
              setImageInputMode('upload');
              setBarcodePrefix('');
              setBarcodeNumber('');
              setIsManualBarcode(false);
              setIsModalOpen(true);
            }}
            style={{
              padding: '9px 18px',
              background: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari nama barang atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                paddingLeft: '36px',
                paddingRight: '12px',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#1E293B',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedFilterCategory}
            onChange={(e) => setSelectedFilterCategory(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#334155',
              background: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kategori}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '13px', color: '#64748B' }}>
          Menampilkan <strong>{filteredItems.length === 0 ? 0 : startIndex + 1} - {endIndex}</strong> dari <strong>{filteredItems.length}</strong> produk
          {filteredItems.length !== items.length && (
            <span style={{ color: '#94A3B8', marginLeft: '4px' }}>
              (total {items.length})
            </span>
          )}
        </div>
      </div>

      {/* 3. Table Kelola Barang */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '52px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                  Gambar
                </th>
                <th
                  onClick={() => setBarcodeSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  title={`Urutkan barcode: ${barcodeSortOrder === 'asc' ? 'A-Z (klik untuk Z-A)' : 'Z-A (klik untuk A-Z)'}`}
                  style={{
                    padding: '11px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#0F172A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    width: '105px',
                    borderRight: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: '#F1F5F9',
                  }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>Barcode</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: '800',
                        lineHeight: 1,
                      }}
                    >
                      {barcodeSortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  </div>
                </th>
                <th style={{ padding: '11px 12px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '180px', borderRight: '1px solid #E2E8F0' }}>
                  Nama Barang
                </th>
                <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px', borderRight: '1px solid #E2E8F0' }}>
                  Kategori
                </th>
                <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '100px', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                  Harga Modal
                </th>
                <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '100px', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                  Harga Jual
                </th>
                <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '115px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                  Stok Barang
                </th>
                <th style={{ padding: '11px 8px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: '95px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                  Status Web
                </th>
                <th style={{
                  padding: '11px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  width: '165px',
                  minWidth: '160px',
                  textAlign: 'center',
                  position: 'sticky',
                  right: 0,
                  background: '#F8FAFC',
                  boxShadow: '-3px 0 6px -2px rgba(0,0,0,0.06)',
                  zIndex: 2,
                }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                    Tidak ada barang yang cocok dengan pencarian
                  </td>
                </tr>
              ) : paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    opacity: item.aktif ? 1 : 0.5,
                    borderBottom: '1px solid #F1F5F9',
                    background: hoveredRowId === item.id ? '#F8FAFC' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  {/* 1. Gambar & Quick Image Edit */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9' }}>
                    <div
                      onClick={() => openQuickImageModal(item)}
                      style={{
                        position: 'relative',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        margin: '0 auto',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                      title="Klik untuk ubah foto produk"
                    >
                      {item.gambar ? (
                        <img src={item.gambar} alt={item.nama_barang} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '14px', color: '#94A3B8' }}>📷</span>
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.45)',
                          opacity: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontSize: '10px',
                          fontWeight: '700',
                          transition: 'opacity 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                      >
                        Ubah
                      </div>
                    </div>
                  </td>

                  {/* 2. Barcode (No Wrap) */}
                  <td style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: '600', color: '#475569', fontFamily: 'monospace', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9' }}>
                    {item.barcode}
                  </td>

                  {/* 3. Nama Barang */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{item.nama_barang}</span>
                        {Number(item.tampil_online) === 1 && (
                          <span
                            title={`Tampil di toko online • ${item.berat_gram || 0}g`}
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              background: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Online{item.berat_gram ? ` · ${item.berat_gram}g` : ''}
                          </span>
                        )}
                      </div>
                      {item.deskripsi && (
                        <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                          {item.deskripsi}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Kategori (No Wrap) */}
                  <td style={{ padding: '10px 8px', verticalAlign: 'middle', whiteSpace: 'nowrap', borderRight: '1px solid #F1F5F9' }}>
                    {item.nama_kategori ? (
                      <span style={{
                        background: '#F1F5F9',
                        color: '#334155',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.nama_kategori}
                      </span>
                    ) : (
                      <span style={{ color: '#CBD5E1', fontSize: '12px' }}>—</span>
                    )}
                  </td>

                  {/* 5. Harga Modal */}
                  <td style={{ padding: '10px 8px', fontSize: '12px', color: '#64748B', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9' }}>
                    Rp {formatRupiah(item.harga_modal)}
                  </td>

                  {/* 6. Harga Jual */}
                  <td style={{ padding: '10px 8px', fontSize: '12.5px', fontWeight: '800', color: '#0F172A', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #F1F5F9' }}>
                    Rp {formatRupiah(item.harga_jual)}
                  </td>

                  {/* 7. Stok Barang & Quick Adjust */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', borderRight: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                          background: item.stok <= 5 ? '#FEF2F2' : '#F0FDF4',
                          color: item.stok <= 5 ? '#DC2626' : '#15803D',
                          border: `1px solid ${item.stok <= 5 ? '#FECACA' : '#BBF7D0'}`,
                        }}
                      >
                        {item.stok} {item.satuan}
                      </span>
                      <button
                        onClick={() => openQuickStockModal(item)}
                        style={{
                          padding: '3px 6px',
                          fontSize: '10.5px',
                          fontWeight: '600',
                          background: '#FFFFFF',
                          color: '#475569',
                          borderRadius: '5px',
                          border: '1px solid #CBD5E1',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                        title="Ubah jumlah stok"
                      >
                        Edit
                      </button>
                    </div>
                  </td>

                  {/* 8. Status Web Toko Online */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', borderRight: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => toggleTampilOnline(item)}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: 'none',
                        whiteSpace: 'nowrap',
                        background: Number(item.tampil_online) === 1 ? '#E8F8EE' : '#F1F5F9',
                        color: Number(item.tampil_online) === 1 ? '#03AC0E' : '#64748B',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Klik untuk ubah apakah barang ini tampil di website"
                    >
                      <span>{Number(item.tampil_online) === 1 ? '● Tampil Web' : '○ Sembunyi'}</span>
                    </button>
                  </td>

                  {/* 9. Aksi (Sticky right - never cut off) */}
                  <td style={{
                    padding: '10px 8px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    right: 0,
                    background: hoveredRowId === item.id ? '#F8FAFC' : '#FFFFFF',
                    boxShadow: '-3px 0 6px -2px rgba(0,0,0,0.06)',
                    zIndex: 1,
                    transition: 'background 0.15s ease',
                  }}>
                    <div style={{ display: 'inline-flex', gap: '4px', whiteSpace: 'nowrap', alignItems: 'center' }}>
                      {item.aktif ? (
                        <>
                          <button
                            onClick={() => openRestockModal(item)}
                            style={{
                              padding: '4px 7px',
                              fontSize: '11px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              color: '#2563EB',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                            }}
                            title="Tambah stok masuk"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => editItem(item)}
                            style={{
                              padding: '4px 7px',
                              fontSize: '11px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px solid #CBD5E1',
                              background: '#FFFFFF',
                              color: '#334155',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                            }}
                            title="Edit produk lengkap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item.id, item.nama_barang)}
                            style={{
                              padding: '4px 7px',
                              fontSize: '11px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              border: '1px solid #FECACA',
                              background: '#FEF2F2',
                              color: '#DC2626',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                            }}
                            title="Hapus produk"
                          >
                            Hapus
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => restoreItem(item.id)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            border: '1px solid #0F172A',
                            background: '#0F172A',
                            color: '#FFFFFF',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Aktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            background: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#64748B' }}>
            Menampilkan{' '}
            <strong style={{ color: '#0F172A', fontWeight: '700' }}>
              {filteredItems.length === 0 ? 0 : startIndex + 1} - {endIndex}
            </strong>{' '}
            dari{' '}
            <strong style={{ color: '#0F172A', fontWeight: '700' }}>
              {filteredItems.length}
            </strong>{' '}
            produk
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: activePage === 1 ? '#F1F5F9' : '#FFFFFF',
                  color: activePage === 1 ? '#94A3B8' : '#0F172A',
                  cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                }}
              >
                ‹ Sebelumnya
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    style={{
                      minWidth: '30px',
                      height: '30px',
                      padding: '0 6px',
                      borderRadius: '6px',
                      border: activePage === page ? 'none' : '1px solid #CBD5E1',
                      background: activePage === page ? '#0F172A' : '#FFFFFF',
                      color: activePage === page ? '#FFFFFF' : '#334155',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: activePage === totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: activePage === totalPages ? '#94A3B8' : '#0F172A',
                  cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.15s ease',
                }}
              >
                Berikutnya ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Tambah / Edit Produk Lengkap ──────────────── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', padding: '28px 32px', maxWidth: '620px' }}>
            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0F172A', margin: '0 0 20px 0' }}>
              {formData.id ? 'Edit Barang & Produk' : 'Tambah Barang Baru'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              
              {/* Gambar Produk: Tab Upload atau Link URL */}
              <div className="form-group" style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>
                    Foto Produk (Katalog Web & Kasir)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '4px',
                        background: imageInputMode === 'upload' ? '#0F172A' : '#E2E8F0',
                        color: imageInputMode === 'upload' ? '#FFFFFF' : '#475569',
                      }}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '700',
                        borderRadius: '4px',
                        background: imageInputMode === 'url' ? '#0F172A' : '#E2E8F0',
                        color: imageInputMode === 'url' ? '#FFFFFF' : '#475569',
                      }}
                    >
                      Link / URL Gambar
                    </button>
                  </div>
                </div>

                {/* Preview Image */}
                {(formData.gambar || (imageInputMode === 'url' && imageUrlInput)) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                    <img
                      src={imageInputMode === 'url' && imageUrlInput ? imageUrlInput : formData.gambar}
                      alt="Preview"
                      style={{ width: '90px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, gambar: '' });
                          setImageUrlInput('');
                        }}
                        style={{
                          padding: '5px 10px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                        }}
                      >
                        ✕ Hapus Foto
                      </button>
                      <small style={{ display: 'block', color: '#64748B', marginTop: '4px', fontSize: '11px' }}>
                        Foto akan ditampilkan di etalase web dan POS kasir
                      </small>
                    </div>
                  </div>
                )}

                {/* Input berdasarkan mode */}
                {imageInputMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ padding: '8px', boxShadow: 'none', background: '#FFFFFF', width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                    <small style={{ color: '#64748B', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                      Mendukung format JPG, PNG, WEBP. Kompresi otomatis aktif.
                    </small>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      placeholder="Tempel link foto gambar (cth: https://images.unsplash.com/...)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      style={{ padding: '9px 12px', width: '100%', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12.5px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* Galeri Foto Tambahan (Multi Image untuk Detail Produk Web) */}
              <div className="form-group" style={{ background: '#F0FDF4', padding: '16px', borderRadius: '10px', border: '1px solid #BBF7D0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#166534' }}>
                    📸 Galeri Foto Tambahan (Maks. 8 Foto)
                  </label>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#15803D' }}>
                    {(formData.galeri_gambar || []).length} / 8 Foto
                  </span>
                </div>
                <small style={{ color: '#4B5563', display: 'block', marginBottom: '12px', fontSize: '11px', lineHeight: '1.4' }}>
                  Foto tambahan akan ditampilkan di thumbnail halaman detail produk storefront web. Anda bisa mengupload foto langsung dari galeri/perangkat atau memasukkan URL foto.
                </small>

                {/* List existing gallery images */}
                {(formData.galeri_gambar || []).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {(formData.galeri_gambar || []).map((url, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', width: '20px' }}>
                          #{idx + 1}
                        </span>
                        <img
                          src={url}
                          alt={`Galeri ${idx + 1}`}
                          style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1', flexShrink: 0, background: '#F8FAFC' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <input
                          type="text"
                          value={url.startsWith('data:image') ? '[Foto Upload File]' : url}
                          readOnly={url.startsWith('data:image')}
                          onChange={(e) => {
                            if (url.startsWith('data:image')) return;
                            const updated = [...formData.galeri_gambar];
                            updated[idx] = e.target.value;
                            setFormData({ ...formData, galeri_gambar: updated });
                          }}
                          style={{ flex: 1, padding: '7px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box', background: url.startsWith('data:image') ? '#F1F5F9' : '#FFFFFF' }}
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.galeri_gambar.filter((_, i) => i !== idx);
                            setFormData({ ...formData, galeri_gambar: updated });
                          }}
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px', background: '#FEE2E2', color: '#DC2626',
                            border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0,
                          }}
                          title="Hapus foto ini"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload & Add buttons */}
                {(formData.galeri_gambar || []).length < 8 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        padding: '8px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '6px',
                        background: '#03AC0E', color: '#FFFFFF', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      📁 Upload Foto dari Perangkat
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, galeri_gambar: [...(formData.galeri_gambar || []), ''] });
                      }}
                      style={{
                        padding: '8px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '6px',
                        background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      + Tambah URL Gambar
                    </button>
                  </div>
                )}
              </div>

              {/* 1. Nama Barang (Full Width) */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '6px', display: 'block' }}>
                  Nama Barang / Produk
                </label>
                <input
                  name="nama_barang"
                  placeholder="Contoh: Baju Anak Lengan Pendek Katun..."
                  value={formData.nama_barang}
                  onChange={handleChange}
                  required
                  style={{
                    height: '42px',
                    padding: '0 14px',
                    fontSize: '13.5px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: 'none',
                  }}
                />
              </div>

              {/* 2. Kategori Produk & Kode Barang / SKU (Side by Side) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Kategori */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '6px', display: 'block' }}>
                    Kategori Produk
                  </label>
                  <select
                    name="kategori_id"
                    value={formData.kategori_id || ''}
                    onChange={handleChange}
                    style={{
                      height: '42px',
                      padding: '0 32px 0 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      width: '100%',
                      boxSizing: 'border-box',
                      boxShadow: 'none',
                      backgroundPosition: 'right 10px center',
                    }}
                  >
                    <option value="">-- Tanpa Kategori --</option>
                    {kategoriList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.kode ? `[${k.kode}] ` : ''}{k.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kode Barang / SKU */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1E293B' }}>
                      Kode Barang / SKU
                    </label>
                    {barcodePrefix && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isManualBarcode) {
                            setIsManualBarcode(true);
                          } else {
                            setIsManualBarcode(false);
                            setFormData((prev) => ({
                              ...prev,
                              barcode: `${barcodePrefix}${barcodeNumber}`,
                            }));
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {isManualBarcode ? `← Gunakan Kode [${barcodePrefix}]` : 'Manual / Scan →'}
                      </button>
                    )}
                  </div>

                  {!isManualBarcode && barcodePrefix ? (
                    <div>
                      <div style={{ display: 'flex', width: '100%', height: '42px' }}>
                        {/* Badge Kode Otomatis dari Kategori yang Dipilih */}
                        <div
                          style={{
                            minWidth: '55px',
                            padding: '0 12px',
                            height: '42px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#E2E8F0',
                            color: '#0F172A',
                            fontWeight: '800',
                            fontSize: '14px',
                            borderRadius: '8px 0 0 8px',
                            border: '1px solid #CBD5E1',
                            borderRight: 'none',
                            letterSpacing: '0.04em',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                            userSelect: 'none',
                          }}
                          title={`Kode otomatis dari kategori`}
                        >
                          {barcodePrefix}
                        </div>

                        {/* Input Nomor Barang Saja */}
                        <input
                          type="text"
                          placeholder="Ketik angka nomor (cth: 001)..."
                          value={barcodeNumber}
                          onChange={handleBarcodeNumberChange}
                          required
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: '42px',
                            padding: '0 12px',
                            fontSize: '13.5px',
                            fontWeight: '600',
                            borderRadius: '0 8px 8px 0',
                            border: '1px solid #CBD5E1',
                            boxSizing: 'border-box',
                            boxShadow: 'none',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#64748B',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>SKU Jadi:</span>
                        <strong
                          style={{
                            color: formData.barcode ? '#1E293B' : '#94A3B8',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            background: formData.barcode ? '#EFF6FF' : '#F8FAFC',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: formData.barcode ? '1px solid #DBEAFE' : '1px solid #E2E8F0',
                          }}
                        >
                          {formData.barcode || '-'}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        name="barcode"
                        placeholder={
                          formData.kategori_id
                            ? "Kategori ini belum ada kode di Master Data, ketik barcode manual..."
                            : "Pilih kategori di sebelah kiri untuk kode otomatis atau ketik manual..."
                        }
                        value={formData.barcode}
                        onChange={handleChange}
                        required
                        style={{
                          height: '42px',
                          padding: '0 12px',
                          fontSize: '13px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          width: '100%',
                          boxSizing: 'border-box',
                          boxShadow: 'none',
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                        {isManualBarcode
                          ? 'Mode ketik manual / barcode scanner.'
                          : 'Pilih kategori yang memiliki kode untuk kode otomatis.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Harga Modal & Jual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '6px', display: 'block' }}>
                    Harga Modal (Rp)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', fontWeight: '600', pointerEvents: 'none' }}>
                      Rp
                    </span>
                    <input
                      type="text"
                      value={displayHargaModal}
                      onChange={(e) => handleCurrencyChange(e, 'harga_modal')}
                      style={{ height: '42px', paddingLeft: '38px', paddingRight: '12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #CBD5E1', width: '100%', boxSizing: 'border-box', boxShadow: 'none' }}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '6px', display: 'block' }}>
                    Harga Jual (Rp)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '13px', fontWeight: '600', pointerEvents: 'none' }}>
                      Rp
                    </span>
                    <input
                      type="text"
                      value={displayHargaJual}
                      onChange={(e) => handleCurrencyChange(e, 'harga_jual')}
                      style={{ height: '42px', paddingLeft: '38px', paddingRight: '12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #CBD5E1', width: '100%', boxSizing: 'border-box', boxShadow: 'none' }}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Stok & Satuan (DAPAT DIEDIT LANGSUNG) */}
              <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Jumlah Stok Barang</span>
                    {formData.id && <span style={{ color: '#03AC0E', fontWeight: '700', fontSize: '11px' }}>✓ Bisa diatur langsung</span>}
                  </label>
                  <input
                    type="number"
                    name="stok"
                    value={formData.stok}
                    onChange={handleChange}
                    required
                    style={{ boxShadow: 'none' }}
                  />
                  <small style={{ color: '#64748B', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                    Masukkan jumlah fisik stok saat ini.
                  </small>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Satuan</label>
                  <select name="satuan" value={formData.satuan} onChange={handleChange} style={{ width: '100%', boxShadow: 'none' }}>
                    <option value="pcs">Pcs</option>
                    <option value="pack">Pack</option>
                    <option value="lusin">Lusin</option>
                    <option value="botol">Botol</option>
                    <option value="box">Box</option>
                  </select>
                </div>
              </div>

              {/* Pengaturan Katalog Toko Online */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginTop: '16px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
                  Pengaturan Katalog Website Online
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Berat Produk (gram)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="0"
                        name="berat_gram"
                        value={formData.berat_gram ?? 200}
                        onChange={handleChange}
                        placeholder="Contoh: 250"
                        style={{ width: '100%', height: '36px', fontSize: '13px', paddingRight: '46px', boxSizing: 'border-box', boxShadow: 'none' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#94A3B8' }}>
                        gram
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Kondisi Produk
                    </label>
                    <select
                      name="kondisi"
                      value={formData.kondisi || 'Baru'}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        height: '36px',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        padding: '0 10px',
                        background: '#FFFFFF',
                        color: '#0F172A',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Baru">Baru</option>
                      <option value="Bekas">Bekas / Preloved</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0F172A', cursor: 'pointer', fontWeight: '700' }}>
                    <input
                      type="checkbox"
                      checked={Number(formData.tampil_online) === 1}
                      onChange={(e) => setFormData({ ...formData, tampil_online: e.target.checked ? 1 : 0 })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Tampil di Website Toko Online
                  </label>
                  <small style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', display: 'block' }}>
                    {Number(formData.tampil_online) === 1 ? '✓ Ditampilkan di halaman web marketplace' : '✗ Hanya dijual kasir fisik'}
                  </small>
                </div>

                {/* Deskripsi Produk / Baju untuk Toko Online */}
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #CBD5E1' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Deskripsi Produk / Baju</span>
                    <span style={{ fontSize: '10.5px', color: '#03AC0E', fontWeight: '600' }}>Tampil di Rincian Toko Web</span>
                  </label>
                  <textarea
                    name="deskripsi"
                    rows={3}
                    value={formData.deskripsi || ''}
                    onChange={handleChange}
                    placeholder="Contoh: Bahan Cotton Combed 30s premium lembut & adem. Jahitan rantai rapi standar distro. Tersedia ukuran M, L, XL. Warna awet dan tidak mudah luntur."
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '12.5px',
                      color: '#1E293B',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: '1.45',
                      boxShadow: 'none',
                    }}
                  />
                  <small style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', display: 'block' }}>
                    Tuliskan spesifikasi bahan, ukuran, keunggulan, atau catatan produk agar pembeli di website yakin membeli.
                  </small>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '9px 18px',
                    background: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Simpan Produk
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Modal Quick Image (Ganti Gambar Cepat) ─────────── */}
      {isQuickImageModalOpen && quickImageTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
              Atur Foto: {quickImageTarget.nama_barang}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
              Ubah atau tambahkan foto produk untuk katalog toko
            </p>

            <form onSubmit={handleQuickImageSave}>
              {quickImageUrl && (
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <img
                    src={quickImageUrl}
                    alt="Preview"
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setQuickImageUrl('')}
                      style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', padding: '3px 8px', background: '#FEE2E2', borderRadius: '4px' }}
                    >
                      Hapus Foto
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Upload dari Perangkat
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQuickImageUpload}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Atau Tempel Link URL Foto
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={quickImageUrl}
                  onChange={(e) => setQuickImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsQuickImageModalOpen(false)}
                  style={{ padding: '8px 14px', background: '#FFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 14px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Simpan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Quick Stock Adjustment (Sesuaikan Stok) ────── */}
      {isQuickStockModalOpen && quickStockTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 6px 0' }}>
              Ubah Stok: {quickStockTarget.nama_barang}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 16px 0' }}>
              Stok saat ini: <strong>{quickStockTarget.stok} {quickStockTarget.satuan}</strong>
            </p>

            <form onSubmit={handleQuickStockSave}>
              <div className="form-group">
                <label>Set Jumlah Stok Baru</label>
                <input
                  type="number"
                  min="0"
                  value={quickStockNewValue}
                  onChange={(e) => setQuickStockNewValue(Number(e.target.value))}
                  required
                  style={{ fontSize: '16px', fontWeight: '700', padding: '10px 14px' }}
                />
              </div>

              {/* Quick shortcut buttons */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {[+5, +10, +25, +50].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setQuickStockNewValue((prev) => Math.max(0, prev + delta))}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      background: '#F1F5F9',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: '#0F172A',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    +{delta}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsQuickStockModalOpen(false)}
                  style={{ padding: '8px 14px', background: '#FFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 14px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Restock Resmi (Dengan Catatan Riwayat) ─────── */}
      {isRestockModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '28px 32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 20px 0' }}>
              Tambah Stok Masuk (Restock)
            </h3>
            <form onSubmit={handleRestockSubmit}>
              <div className="form-group">
                <label>Jumlah Tambah (Qty)</label>
                <input
                  type="number"
                  min="1"
                  value={restockData.qty}
                  onChange={(e) => setRestockData({ ...restockData, qty: Number(e.target.value) })}
                  required
                  style={{ boxShadow: 'none' }}
                />
              </div>
              <div className="form-group">
                <label>Keterangan (Opsional)</label>
                <textarea
                  rows="3"
                  value={restockData.keterangan}
                  onChange={(e) => setRestockData({ ...restockData, keterangan: e.target.value })}
                  placeholder="Contoh: Barang masuk dari Supplier A / Restock Toko"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxShadow: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    background: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
