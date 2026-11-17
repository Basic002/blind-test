const APP_ICONS = {
  fox: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_fox_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FF7A00"/><stop offset="1" stop-color="#E63946"/></linearGradient></defs><path d="M6 5 L13 14 L5 15 Z" fill="#2B1A12"/><path d="M26 5 L19 14 L27 15 Z" fill="#2B1A12"/><path d="M7 7 L12 13 L6 14 Z" fill="#FFA07A"/><path d="M25 7 L20 13 L26 14 Z" fill="#FFA07A"/><path d="M16 28 L5 14 C4 9 10 9 16 11 C22 9 28 9 27 14 Z" fill="url(#bt_fox_g)"/><path d="M16 28 L8 16 C11 16 13 18 16 21 C19 18 21 16 24 16 Z" fill="#FFF8F0"/><ellipse cx="11.5" cy="15" rx="1.8" ry="2.2" fill="#1C1917"/><ellipse cx="20.5" cy="15" rx="1.8" ry="2.2" fill="#1C1917"/><circle cx="12.2" cy="14.3" r="0.6" fill="#FFFFFF"/><circle cx="21.2" cy="14.3" r="0.6" fill="#FFFFFF"/><path d="M16 28 L14 25.5 C15.2 25 16.8 25 18 25.5 Z" fill="#1C1917"/></svg>`,

  tiger: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_tig_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FFB703"/><stop offset="1" stop-color="#FB8500"/></linearGradient></defs><circle cx="7" cy="8" r="4.5" fill="#FB8500"/><circle cx="7" cy="8" r="2.3" fill="#FFE8A3"/><circle cx="25" cy="8" r="4.5" fill="#FB8500"/><circle cx="25" cy="8" r="2.3" fill="#FFE8A3"/><rect x="5" y="7" width="22" height="20" rx="9" fill="url(#bt_tig_g)"/><path d="M16 8 L16 12 M13 9.5 L14.5 12 M19 9.5 L17.5 12" stroke="#2B1A12" stroke-width="1.8" stroke-linecap="round"/><path d="M5.5 16 L9.5 17 M5.5 20 L9.5 20 M26.5 16 L22.5 17 M26.5 20 L22.5 20" stroke="#2B1A12" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="16" cy="22" rx="5.5" ry="3.5" fill="#FFFDF0"/><polygon points="16,22 14,20 18,20" fill="#E63946"/><ellipse cx="11.5" cy="15" rx="1.8" ry="2.2" fill="#2B1A12"/><ellipse cx="20.5" cy="15" rx="1.8" ry="2.2" fill="#2B1A12"/><circle cx="12.2" cy="14.3" r="0.6" fill="#FFFFFF"/><circle cx="21.2" cy="14.3" r="0.6" fill="#FFFFFF"/></svg>`,

  rocket: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_rkt_fl" x1="16" y1="23" x2="16" y2="31" gradientUnits="userSpaceOnUse"><stop stop-color="#FF0055"/><stop offset="0.6" stop-color="#FF9900"/><stop offset="1" stop-color="#FFDD00"/></linearGradient><linearGradient id="bt_rkt_bd" x1="11" y1="4" x2="21" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#FFFFFF"/><stop offset="1" stop-color="#CBD5E1"/></linearGradient></defs><path d="M13 24 C13 28 16 31.5 16 31.5 C16 31.5 19 28 19 24 Z" fill="url(#bt_rkt_fl)"/><path d="M14.5 24 C14.5 27 16 29 16 29 C16 29 17.5 27 17.5 24 Z" fill="#FFFFFF"/><path d="M11 18 L5 24 C7.5 24.5 10.5 23.5 11 21.5 Z" fill="#00D2FF"/><path d="M21 18 L27 24 C24.5 24.5 21.5 23.5 21 21.5 Z" fill="#00D2FF"/><path d="M16 2 C21 6.5 22 15 21 24 L11 24 C10 15 11 6.5 16 2 Z" fill="url(#bt_rkt_bd)"/><path d="M16 2 C18 4.5 19.8 7.5 20.3 10.5 L11.7 10.5 C12.2 7.5 14 4.5 16 2 Z" fill="#FF3366"/><circle cx="16" cy="16" r="3.2" fill="#0F172A" stroke="#00D2FF" stroke-width="1.4"/><circle cx="15" cy="15" r="1" fill="#FFFFFF"/></svg>`,

  headphones: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_hp_g" x1="5" y1="4" x2="27" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#00F0FF"/><stop offset="1" stop-color="#7000FF"/></linearGradient></defs><path d="M6 16 C6 8.5 10.5 4 16 4 C21.5 4 26 8.5 26 16" stroke="url(#bt_hp_g)" stroke-width="3.2" stroke-linecap="round"/><rect x="4" y="14" width="5.5" height="12" rx="2.75" fill="#00F0FF"/><rect x="22.5" y="14" width="5.5" height="12" rx="2.75" fill="#00F0FF"/><rect x="6.5" y="16.5" width="2" height="7" rx="1" fill="#0B132B"/><rect x="23.5" y="16.5" width="2" height="7" rx="1" fill="#0B132B"/><path d="M1.5 17.5 C0.8 19 0.8 21 1.5 22.5 M30.5 17.5 C31.2 19 31.2 21 30.5 22.5" stroke="#FF007F" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  bolt: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_blt_g" x1="18" y1="2" x2="13" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#FFF04B"/><stop offset="1" stop-color="#FF8A00"/></linearGradient></defs><path d="M18.5 2 L6.5 16.5 L14.5 16.5 L12.5 30 L25.5 13.5 L17 13.5 Z" fill="url(#bt_blt_g)" stroke="#FFAA00" stroke-width="0.8" stroke-linejoin="round"/></svg>`,

  pizza: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_piz_g" x1="7" y1="8" x2="25" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FFDD53"/><stop offset="1" stop-color="#FFAC1C"/></linearGradient></defs><path d="M6 7.5 C12.5 4.5 19.5 4.5 26 7.5" stroke="#C97A2C" stroke-width="3.5" stroke-linecap="round"/><path d="M6.5 9 L16 28 L25.5 9 C19.5 7 12.5 7 6.5 9 Z" fill="url(#bt_piz_g)"/><circle cx="13" cy="14" r="2.2" fill="#E63946"/><circle cx="19.5" cy="15.5" r="2" fill="#E63946"/><circle cx="16" cy="22" r="1.8" fill="#E63946"/><circle cx="13" cy="13.7" r="0.6" fill="#FFA5AB"/><circle cx="19.5" cy="15.2" r="0.5" fill="#FFA5AB"/><circle cx="16" cy="21.7" r="0.5" fill="#FFA5AB"/><circle cx="11" cy="18" r="0.8" fill="#2A9D8F"/><circle cx="21" cy="11.5" r="0.8" fill="#2A9D8F"/></svg>`,

  crown: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_crn_g" x1="5" y1="6" x2="27" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE600"/><stop offset="1" stop-color="#FF9500"/></linearGradient></defs><path d="M5 24 L7.5 10 L12.5 16.5 L16 7 L19.5 16.5 L24.5 10 L27 24 Z" fill="url(#bt_crn_g)" stroke="#E07A00" stroke-width="0.8" stroke-linejoin="round"/><rect x="4.5" y="23" width="23" height="4" rx="2" fill="#D9531E"/><circle cx="16" cy="7" r="1.8" fill="#00E5FF"/><circle cx="7.5" cy="10" r="1.5" fill="#FF0077"/><circle cx="24.5" cy="10" r="1.5" fill="#FF0077"/><circle cx="10" cy="25" r="1.2" fill="#00E5FF"/><circle cx="16" cy="25" r="1.2" fill="#FFE600"/><circle cx="22" cy="25" r="1.2" fill="#00E5FF"/></svg>`,

  unicorn: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_uni_h" x1="18" y1="2" x2="22" y2="10" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE600"/><stop offset="1" stop-color="#FF7700"/></linearGradient><linearGradient id="bt_uni_m" x1="6" y1="10" x2="20" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FF007F"/><stop offset="1" stop-color="#7928CA"/></linearGradient></defs><path d="M19 2 L22 10 L16 9 Z" fill="url(#bt_uni_h)"/><path d="M9 12 C7 15 6 21 8 26 C9 23 11 21 13 20 C10 24 12 28 15 28 C15 24 16 21 18 19 Z" fill="url(#bt_uni_m)"/><path d="M14 9 C11 9.5 10 12 11 16 L7 18 C6.5 19.5 7.5 21.5 9.5 22 L15 21 L18 28 L23 28 L22 19 C24 16 23 11 19 9.5 Z" fill="#FFFFFF"/><path d="M12 10 L14 6 L16 10 Z" fill="#FFA5AB"/><circle cx="17.5" cy="14" r="1.4" fill="#1A1A24"/><circle cx="18" cy="13.5" r="0.5" fill="#FFFFFF"/><path d="M8 20 C8.5 20 9 20.5 9 21" stroke="#FFA5AB" stroke-width="1" stroke-linecap="round"/></svg>`,

  guitar: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_gt_g" x1="6" y1="12" x2="22" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FF0055"/><stop offset="1" stop-color="#7B002C"/></linearGradient></defs><rect x="18" y="4" width="3" height="14" rx="1.5" transform="rotate(45 18 4)" fill="#E2E8F0"/><rect x="25" y="3" width="4" height="6" rx="1" transform="rotate(45 25 3)" fill="#334155"/><path d="M9 17 C6 18 5 21 6 24 C7 27 10 28 13 27 C15 26 15 24 17 25 C19 26 21 25 22 23 C23 21 22 18 19 17 C16 16 16 18 14 16 C12 14 11 16 9 17 Z" fill="url(#bt_gt_g)" stroke="#FF5588" stroke-width="0.8"/><circle cx="14" cy="21" r="2.5" fill="#0F172A"/><path d="M26 6 L12 20 M27 7 L13 21" stroke="#FFFFFF" stroke-width="0.5" opacity="0.8"/></svg>`,

  invader: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_inv_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#00FF88"/><stop offset="1" stop-color="#00AA55"/></linearGradient></defs><rect x="8" y="4" width="3" height="4" fill="url(#bt_inv_g)"/><rect x="21" y="4" width="3" height="4" fill="url(#bt_inv_g)"/><rect x="10" y="8" width="12" height="14" rx="2" fill="url(#bt_inv_g)"/><rect x="5" y="11" width="22" height="7" rx="2" fill="url(#bt_inv_g)"/><rect x="3" y="14" width="26" height="5" rx="1" fill="url(#bt_inv_g)"/><rect x="7" y="22" width="4" height="6" rx="1" fill="url(#bt_inv_g)"/><rect x="21" y="22" width="4" height="6" rx="1" fill="url(#bt_inv_g)"/><rect x="13" y="20" width="6" height="4" fill="url(#bt_inv_g)"/><rect x="9" y="13" width="3.5" height="3.5" rx="1" fill="#0B132B"/><rect x="19.5" y="13" width="3.5" height="3.5" rx="1" fill="#0B132B"/><circle cx="10.5" cy="14.5" r="0.8" fill="#FFFFFF"/><circle cx="21.5" cy="14.5" r="0.8" fill="#FFFFFF"/></svg>`,

  music: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_mus_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#00E5FF"/><stop offset="0.5" stop-color="#9D4EDD"/><stop offset="1" stop-color="#FF007F"/></linearGradient></defs><ellipse cx="9" cy="24" rx="4.5" ry="3.2" transform="rotate(-20 9 24)" fill="url(#bt_mus_g)"/><ellipse cx="23" cy="20" rx="4.5" ry="3.2" transform="rotate(-20 23 20)" fill="url(#bt_mus_g)"/><rect x="12" y="8" width="2.5" height="16" rx="1.25" fill="url(#bt_mus_g)"/><rect x="26" y="4" width="2.5" height="16" rx="1.25" fill="url(#bt_mus_g)"/><polygon points="12,8 28.5,4 28.5,8.5 12,12.5" fill="url(#bt_mus_g)"/></svg>`,

  disney: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_dis_g" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#38BDF8"/><stop offset="0.6" stop-color="#6366F1"/><stop offset="1" stop-color="#A855F7"/></linearGradient></defs><path d="M4 28 L28 28 L28 20 L25 20 L25 22 L23 22 L23 16 L21 16 L21 22 L11 22 L11 16 L9 16 L9 22 L7 22 L7 20 L4 20 Z" fill="url(#bt_dis_g)"/><rect x="13" y="11" width="6" height="13" fill="url(#bt_dis_g)"/><polygon points="16,3 12,11 20,11" fill="#FACC15"/><polygon points="8,10 5,16 11,16" fill="#FACC15"/><polygon points="24,10 21,16 27,16" fill="#FACC15"/><path d="M14 28 A2 2 0 0 1 18 28 Z" fill="#0B132B"/><circle cx="16" cy="3" r="1.5" fill="#FFF"/><path d="M25 5 C23 7 19 8 16 7" stroke="#FFF" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="2 2"/></svg>`,

  '2000s': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_2000_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#3B82F6"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient></defs><path d="M5 4 L24 4 L28 8 L28 27 C28 27.5 27.5 28 27 28 L5 28 C4.5 28 4 27.5 4 27 L4 5 C4 4.5 4.5 4 5 4 Z" fill="url(#bt_2000_g)"/><rect x="8" y="4" width="13" height="9" rx="1" fill="#E2E8F0"/><rect x="15" y="6" width="3.5" height="5" rx="0.5" fill="#0F172A"/><rect x="7" y="17" width="18" height="11" rx="1.5" fill="#FFFFFF"/><rect x="9" y="19" width="14" height="2" fill="#3B82F6"/><rect x="9" y="23" width="10" height="2" fill="#CBD5E1"/></svg>`,

  'rap-fr': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_rap_g" x1="11" y1="3" x2="21" y2="17" gradientUnits="userSpaceOnUse"><stop stop-color="#F43F5E"/><stop offset="1" stop-color="#BE123C"/></linearGradient></defs><rect x="11" y="3" width="10" height="14" rx="5" fill="url(#bt_rap_g)" stroke="#FFE4E6" stroke-width="1.2"/><line x1="11" y1="9" x2="21" y2="9" stroke="#FFE4E6" stroke-width="1.2"/><line x1="16" y1="3" x2="16" y2="17" stroke="#FFE4E6" stroke-width="1.2"/><path d="M7 12 C7 17.5 11 21 16 21 C21 21 25 17.5 25 12" stroke="#CBD5E1" stroke-width="2.4" stroke-linecap="round"/><line x1="16" y1="21" x2="16" y2="28" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/><line x1="11" y1="28" x2="21" y2="28" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/><path d="M4 8 C2.5 10 2.5 14 4 16 M28 8 C29.5 10 29.5 14 28 16" stroke="#FB7185" stroke-width="1.8" stroke-linecap="round"/></svg>`,

  anime: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_ani_g" x1="6" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#FF0055"/><stop offset="0.5" stop-color="#FF9900"/><stop offset="1" stop-color="#FFEA00"/></linearGradient></defs><polygon points="17,2 7,16 15,16 12,30 25,14 17,14" fill="url(#bt_ani_g)" stroke="#FFF" stroke-width="0.8"/><circle cx="7" cy="8" r="1.5" fill="#FFEA00"/><circle cx="26" cy="22" r="1.5" fill="#FF0055"/><polygon points="25,5 26,7 28,7 26.5,8.5 27,10.5 25,9 23,10.5 23.5,8.5 22,7 24,7" fill="#FFF"/></svg>`,

  cinema: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_cin_g" x1="4" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#EF4444"/><stop offset="1" stop-color="#991B1B"/></linearGradient></defs><rect x="4" y="13" width="24" height="15" rx="2" fill="url(#bt_cin_g)" stroke="#F87171" stroke-width="1"/><g transform="rotate(-12 5 13)"><rect x="3" y="6" width="25" height="7" rx="1.5" fill="#1E293B"/><polygon points="5,6 8,6 12,13 9,13" fill="#FFFFFF"/><polygon points="13,6 16,6 20,13 17,13" fill="#FFFFFF"/><polygon points="21,6 24,6 27,13 24,13" fill="#FFFFFF"/></g><polygon points="13,17 21,21 13,25" fill="#FFFFFF"/></svg>`,

  series: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_ser_g" x1="4" y1="10" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#A855F7"/><stop offset="1" stop-color="#6B21A8"/></linearGradient></defs><line x1="10" y1="4" x2="16" y2="10" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="4" x2="16" y2="10" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/><rect x="3" y="10" width="26" height="18" rx="3.5" fill="url(#bt_ser_g)" stroke="#C084FC" stroke-width="1"/><rect x="6" y="13" width="16" height="12" rx="2" fill="#0B132B"/><circle cx="25.5" cy="16" r="1.5" fill="#FACC15"/><circle cx="25.5" cy="21" r="1.5" fill="#F43F5E"/><path d="M9 16 C12 14 16 21 19 19" stroke="#38BDF8" stroke-width="1.2" stroke-linecap="round" fill="none"/></svg>`,

  gaming: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_gam_g" x1="4" y1="8" x2="28" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#10B981"/><stop offset="1" stop-color="#047857"/></linearGradient></defs><path d="M6 10 C10 8 22 8 26 10 C29 11.5 30 18 28 24 C27 27 23 27 21 23 L18 19 L14 19 L11 23 C9 27 5 27 4 24 C2 18 3 11.5 6 10 Z" fill="url(#bt_gam_g)" stroke="#34D399" stroke-width="1"/><line x1="8.5" y1="14" x2="12.5" y2="14" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/><line x1="10.5" y1="12" x2="10.5" y2="16" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/><circle cx="21" cy="15.5" r="1.3" fill="#F43F5E"/><circle cx="23.5" cy="13" r="1.3" fill="#FACC15"/><circle cx="19.5" cy="13" r="1.3" fill="#38BDF8"/><circle cx="22" cy="10.5" r="1.3" fill="#4ADE80"/></svg>`,

  '80s': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_80_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#EC4899"/><stop offset="0.5" stop-color="#8B5CF6"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><line x1="16" y1="1" x2="16" y2="6" stroke="#CBD5E1" stroke-width="1.5"/><circle cx="16" cy="18" r="11" fill="url(#bt_80_g)" stroke="#F472B6" stroke-width="1"/><path d="M6 15 H26 M6 21 H26 M16 7 V29 M10 9 V27 M22 9 V27" stroke="#FFFFFF" stroke-width="0.8" opacity="0.6"/><polygon points="26,8 27.5,10.5 30,10.5 28,12 28.8,14.5 26.5,13 24.2,14.5 25,12 23,10.5 25.5,10.5" fill="#FFE600"/><polygon points="6,24 7,25.5 9,25.5 7.5,26.5 8,28.5 6.5,27.5 5,28.5 5.5,26.5 4,25.5 5.8,25.5" fill="#00E5FF"/></svg>`,

  '80s-fr': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="13" fill="#1E293B" stroke="#64748B" stroke-width="1"/><circle cx="16" cy="16" r="9" stroke="#334155" stroke-width="0.7"/><circle cx="16" cy="16" r="6" stroke="#334155" stroke-width="0.7"/><g><path d="M16 10 A6 6 0 0 0 10 16 L16 16 Z" fill="#2563EB"/><path d="M10 16 A6 6 0 0 0 16 22 L16 16 Z" fill="#FFFFFF"/><path d="M16 10 A6 6 0 0 1 22 16 L16 16 Z" fill="#DC2626"/><path d="M22 16 A6 6 0 0 1 16 22 L16 16 Z" fill="#DC2626"/></g><circle cx="16" cy="16" r="2" fill="#0F172A"/></svg>`,

  '2000s-fr': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_vhs_g" x1="4" y1="8" x2="28" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#1E293B"/><stop offset="1" stop-color="#0F172A"/></linearGradient></defs><rect x="3" y="7" width="26" height="18" rx="2" fill="url(#bt_vhs_g)" stroke="#475569" stroke-width="1"/><rect x="6" y="10" width="20" height="7" rx="1" fill="#334155"/><circle cx="11" cy="13.5" r="2.5" fill="#FFFFFF"/><circle cx="21" cy="13.5" r="2.5" fill="#FFFFFF"/><circle cx="11" cy="13.5" r="1.2" fill="#0F172A"/><circle cx="21" cy="13.5" r="1.2" fill="#0F172A"/><rect x="7" y="19.5" width="18" height="3" rx="0.5" fill="#F97316"/></svg>`,

  'pop-hits': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_pop_fl" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1E00"/><stop offset="0.6" stop-color="#FF8A00"/><stop offset="1" stop-color="#FFDD00"/></linearGradient></defs><path d="M16 2 C19 8 26 12 26 19 C26 24.5 21.5 29 16 29 C10.5 29 6 24.5 6 19 C6 14 11 9 13 4 C14 8 16 9 16 2 Z" fill="url(#bt_pop_fl)"/><path d="M16 13 C18 16 21 18 21 22 C21 25 18.5 27 16 27 C13.5 27 11 25 11 22 C11 19 14 16 16 13 Z" fill="#FFE600"/></svg>`,

  rock: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_rck_g" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#DC2626"/><stop offset="1" stop-color="#7F1D1D"/></linearGradient></defs><polygon points="16,3 18,17 28,27 21,28 16,19 11,28 4,27 14,17" fill="url(#bt_rck_g)" stroke="#F87171" stroke-width="1"/><line x1="16" y1="3" x2="16" y2="19" stroke="#E2E8F0" stroke-width="1"/><circle cx="16" cy="18" r="2" fill="#0B132B"/><polygon points="26,4 21,12 25,12 20,20 27,10 23,10" fill="#FACC15"/></svg>`,

  custom: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_cst_g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#06B6D4"/><stop offset="1" stop-color="#3B82F6"/></linearGradient></defs><rect x="6" y="11" width="11" height="10" rx="5" stroke="url(#bt_cst_g)" stroke-width="3" fill="none"/><rect x="15" y="11" width="11" height="10" rx="5" stroke="url(#bt_cst_g)" stroke-width="3" fill="none"/><line x1="12" y1="16" x2="20" y2="16" stroke="url(#bt_cst_g)" stroke-width="3" stroke-linecap="round"/></svg>`,

  trophy: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_tro_g" x1="8" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE600"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><path d="M9 4 L23 4 L23 13 C23 17 20 20 16 20 C12 20 9 17 9 13 Z" fill="url(#bt_tro_g)" stroke="#D97706" stroke-width="1"/><path d="M9 7 C6 7 4 9 4 12 C4 14.5 6 16.5 9 16.5" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M23 7 C26 7 28 9 28 12 C28 14.5 26 16.5 23 16.5" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" fill="none"/><rect x="14" y="20" width="4" height="5" fill="#D97706"/><rect x="10" y="25" width="12" height="4" rx="1.5" fill="#78350F"/><polygon points="16,8 17.2,11 20.5,11.2 18,13.2 18.8,16.5 16,14.8 13.2,16.5 14,13.2 11.5,11.2 14.8,11" fill="#FFFFFF"/></svg>`,

  'medal-gold': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_md1_g" x1="8" y1="12" x2="24" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FFEA00"/><stop offset="1" stop-color="#FF9900"/></linearGradient></defs><path d="M12 2 L9 14 L15 14 L16 2 Z" fill="#EF4444"/><path d="M20 2 L23 14 L17 14 L16 2 Z" fill="#3B82F6"/><circle cx="16" cy="20" r="9.5" fill="url(#bt_md1_g)" stroke="#D97706" stroke-width="1.2"/><circle cx="16" cy="20" r="7.5" stroke="#FFEBA8" stroke-width="0.8" stroke-dasharray="2 2"/><text x="16" y="24" font-size="11" font-weight="900" font-family="system-ui, sans-serif" fill="#78350F" text-anchor="middle">1</text></svg>`,

  'medal-silver': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_md2_g" x1="8" y1="12" x2="24" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#F1F5F9"/><stop offset="1" stop-color="#94A3B8"/></linearGradient></defs><path d="M12 2 L9 14 L15 14 L16 2 Z" fill="#3B82F6"/><path d="M20 2 L23 14 L17 14 L16 2 Z" fill="#10B981"/><circle cx="16" cy="20" r="9.5" fill="url(#bt_md2_g)" stroke="#64748B" stroke-width="1.2"/><circle cx="16" cy="20" r="7.5" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2 2"/><text x="16" y="24" font-size="11" font-weight="900" font-family="system-ui, sans-serif" fill="#334155" text-anchor="middle">2</text></svg>`,

  'medal-bronze': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_md3_g" x1="8" y1="12" x2="24" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FDBA74"/><stop offset="1" stop-color="#C2410C"/></linearGradient></defs><path d="M12 2 L9 14 L15 14 L16 2 Z" fill="#10B981"/><path d="M20 2 L23 14 L17 14 L16 2 Z" fill="#EF4444"/><circle cx="16" cy="20" r="9.5" fill="url(#bt_md3_g)" stroke="#9A3412" stroke-width="1.2"/><circle cx="16" cy="20" r="7.5" stroke="#FED7AA" stroke-width="0.8" stroke-dasharray="2 2"/><text x="16" y="24" font-size="11" font-weight="900" font-family="system-ui, sans-serif" fill="#431407" text-anchor="middle">3</text></svg>`,

  fusee: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_aw_fus" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#38BDF8"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs><path d="M20 3 C27 4 29 12 29 12 C29 12 21 14 20 21 L16 17 L19 13 L15 9 L11 12 L7 8 C14 7 16 3 20 3 Z" fill="url(#bt_aw_fus)"/><path d="M12 20 L5 27 C4 28 3 27 4 26 L11 19 Z" fill="#FF4766"/><line x1="3" y1="21" x2="7" y2="21" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/><line x1="11" y1="29" x2="11" y2="25" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/></svg>`,

  sniper: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="11" stroke="#EF4444" stroke-width="2.5" fill="none"/><circle cx="16" cy="16" r="6" stroke="#EF4444" stroke-width="1.5" fill="none"/><circle cx="16" cy="16" r="2.5" fill="#EF4444"/><line x1="16" y1="2" x2="16" y2="9" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="23" x2="16" y2="30" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/><line x1="2" y1="16" x2="9" y2="16" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/><line x1="23" y1="16" x2="30" y2="16" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/></svg>`,

  eclair: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_aw_ecl" x1="18" y1="2" x2="13" y2="30" gradientUnits="userSpaceOnUse"><stop stop-color="#FFE600"/><stop offset="1" stop-color="#FF8A00"/></linearGradient></defs><path d="M19 2 L6 17 L15 17 L13 30 L26 13 L17 13 Z" fill="url(#bt_aw_ecl)" stroke="#FFAA00" stroke-width="1" stroke-linejoin="round"/><circle cx="7" cy="8" r="1.5" fill="#FFE600"/><circle cx="25" cy="24" r="1.5" fill="#FFE600"/></svg>`,

  incendiaire: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_aw_inc" x1="8" y1="3" x2="24" y2="29" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1E00"/><stop offset="0.6" stop-color="#FF7A00"/><stop offset="1" stop-color="#FFD600"/></linearGradient></defs><path d="M16 2 C19 7 26 11 26 19 C26 24.5 21.5 29 16 29 C10.5 29 6 24.5 6 19 C6 13 12 8 14 3 C15 7 16 8 16 2 Z" fill="url(#bt_aw_inc)"/><path d="M16 14 C18 17 21 19 21 22 C21 25 18.5 27 16 27 C13.5 27 11 25 11 22 C11 19 14 17 16 14 Z" fill="#FFF275"/></svg>`,

  tortue: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_aw_tor" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#10B981"/><stop offset="1" stop-color="#047857"/></linearGradient></defs><circle cx="25" cy="12" r="3.5" fill="#34D399"/><circle cx="26" cy="11.5" r="0.8" fill="#064E3B"/><ellipse cx="8" cy="22" rx="2.5" ry="1.8" fill="#34D399"/><ellipse cx="20" cy="22" rx="2.5" ry="1.8" fill="#34D399"/><path d="M6 18 C6 11 10 7 17 7 C23 7 25 11 25 18 Z" fill="url(#bt_aw_tor)" stroke="#065F46" stroke-width="1.2"/><path d="M11 18 L14 12 L18 12 L20 18" stroke="#A7F3D0" stroke-width="1.2" stroke-linecap="round"/><line x1="6" y1="18" x2="25" y2="18" stroke="#065F46" stroke-width="1.5"/></svg>`,

  chat_noir: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_aw_cat" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#334155"/><stop offset="1" stop-color="#0F172A"/></linearGradient></defs><polygon points="7,6 13,14 6,15" fill="#0F172A"/><polygon points="25,6 19,14 26,15" fill="#0F172A"/><path d="M16 28 C7 28 5 20 5 15 C5 10 10 10 16 11 C22 10 27 10 27 15 C27 20 25 28 16 28 Z" fill="url(#bt_aw_cat)" stroke="#475569" stroke-width="1"/><polygon points="11,15 14,17 11,19" fill="#FACC15"/><polygon points="21,15 18,17 21,19" fill="#FACC15"/><circle cx="12.5" cy="17" r="0.8" fill="#0F172A"/><circle cx="19.5" cy="17" r="0.8" fill="#0F172A"/><polygon points="16,21 14.5,19.5 17.5,19.5" fill="#F43F5E"/><path d="M16 21 L16 23 M13 22 L11 23 M19 22 L21 23" stroke="#94A3B8" stroke-width="1" stroke-linecap="round"/></svg>`,

  'bell-on': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M16 4 C11 4 9 8 9 14 L7 20 L25 20 L23 14 C23 8 21 4 16 4 Z" fill="#FACC15" stroke="#EAB308" stroke-width="1.5"/><circle cx="16" cy="24" r="3" fill="#CA8A04"/><path d="M4 11 C3 13 3 17 4 19 M28 11 C29 13 29 17 28 19" stroke="#FACC15" stroke-width="2" stroke-linecap="round"/></svg>`,

  'bell-off': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M16 4 C12 4 9.5 7.5 9 13 L9 14 L23 14 C23 8 21 4 16 4 Z" fill="#64748B"/><path d="M11 20 L7 20 L9 15 M21 20 L25 20 L23 15" stroke="#64748B" stroke-width="1.5" stroke-linecap="round"/><circle cx="16" cy="24" r="3" fill="#475569"/><line x1="5" y1="5" x2="27" y2="27" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/></svg>`,

  'volume-up': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><polygon points="6,12 11,12 17,7 17,25 11,20 6,20" fill="#38BDF8"/><path d="M21 11 C23 13 23 19 21 21 M24 7 C28 11 28 21 24 25" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round"/></svg>`,

  check: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="14" fill="#10B981"/><path d="M9 16 L14 21 L23 11" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  cross: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="14" fill="#EF4444"/><path d="M11 11 L21 21 M21 11 L11 21" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/></svg>`,

  lock: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M10 13 V9 C10 5.5 12.5 3 16 3 C19.5 3 22 5.5 22 9 V13" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/><rect x="6" y="13" width="20" height="15" rx="3" fill="#EAB308" stroke="#CA8A04" stroke-width="1.5"/><circle cx="16" cy="19.5" r="2" fill="#78350F"/><path d="M16 21.5 V24" stroke="#78350F" stroke-width="2" stroke-linecap="round"/></svg>`,

  unlock: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M10 11 V9 C10 5.5 12.5 3 16 3 C19.5 3 22 5.5 22 9" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/><rect x="6" y="13" width="20" height="15" rx="3" fill="#EAB308" stroke="#CA8A04" stroke-width="1.5"/><circle cx="16" cy="19.5" r="2" fill="#78350F"/><path d="M16 21.5 V24" stroke="#78350F" stroke-width="2" stroke-linecap="round"/></svg>`,

  user: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="11" r="6" fill="#38BDF8"/><path d="M6 27 C6 21 10.5 19 16 19 C21.5 19 26 21 26 27" fill="#38BDF8"/></svg>`,

  gamepad: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M6 10 C10 8 22 8 26 10 C29 11.5 30 18 28 24 C27 27 23 27 21 23 L18 19 L14 19 L11 23 C9 27 5 27 4 24 C2 18 3 11.5 6 10 Z" fill="#6366F1"/><line x1="8" y1="14" x2="12" y2="14" stroke="#FFF" stroke-width="1.5"/><line x1="10" y1="12" x2="10" y2="16" stroke="#FFF" stroke-width="1.5"/><circle cx="21" cy="15" r="1.2" fill="#F43F5E"/><circle cx="23" cy="13" r="1.2" fill="#FACC15"/></svg>`,

  flame: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><defs><linearGradient id="bt_flm_g" x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="#FF1E00"/><stop offset="0.6" stop-color="#FF8A00"/><stop offset="1" stop-color="#FFDD00"/></linearGradient></defs><path d="M16 2 C19 7 26 11 26 19 C26 24.5 21.5 29 16 29 C10.5 29 6 24.5 6 19 C6 13 12 8 14 3 C15 7 16 8 16 2 Z" fill="url(#bt_flm_g)"/><path d="M16 13 C18 16 21 18 21 22 C21 25 18.5 27 16 27 C13.5 27 11 25 11 22 C11 19 14 16 16 13 Z" fill="#FFE600"/></svg>`,

  mobile: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><rect x="8" y="3" width="16" height="26" rx="4" fill="#1E293B" stroke="#64748B" stroke-width="1.8"/><rect x="10" y="6" width="12" height="17" rx="1.5" fill="#00D2FF"/><circle cx="16" cy="26" r="1.2" fill="#94A3B8"/></svg>`,

  party: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><polygon points="6,28 17,23 11,13" fill="#F59E0B" stroke="#D97706" stroke-width="1"/><polygon points="8,26 15,23 11,16" fill="#FACC15"/><circle cx="21" cy="9" r="1.5" fill="#EF4444"/><circle cx="26" cy="14" r="1.5" fill="#3B82F6"/><circle cx="17" cy="6" r="1.5" fill="#10B981"/><path d="M16 14 C19 12 21 15 24 13 M14 9 C18 8 19 11 23 8" stroke="#EC4899" stroke-width="1.5" stroke-linecap="round"/></svg>`,

  wave: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M12 28 C9 28 6 25 6 22 L6 14 C6 12 7.5 11 9 11 C10.5 11 12 12 12 14 L12 20 M12 14 C12 11.5 13.5 10 15 10 C16.5 10 18 11.5 18 14 L18 20 M18 14 C18 11.5 19.5 10 21 10 C22.5 10 24 11.5 24 14 L24 20 M24 16 C24 14 25.5 13 27 13 C28.5 13 29 14.5 29 16 C29 22 25 28 20 28 Z" fill="#FBBF24"/><path d="M5 6 C3 8 2 11 2 14 M29 4 C31 7 32 10 32 14" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/></svg>`,

  'arrow-right': (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M7 16 H25 M18 9 L25 16 L18 23" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  skip: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><polygon points="6,8 18,16 6,24" fill="currentColor"/><polygon points="16,8 28,16 16,24" fill="currentColor"/></svg>`,

  star: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><polygon points="16,3 20,11.5 29,12.5 22.5,18.5 24.5,27.5 16,23 7.5,27.5 9.5,18.5 3,12.5 12,11.5" fill="#FACC15" stroke="#EAB308" stroke-width="1"/></svg>`,

  sprout: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M16 28 V15 M16 15 C16 9 10 6 5 8 C5 14 10 16 16 15 Z" fill="#4ADE80" stroke="#16A34A" stroke-width="1.5"/><path d="M16 15 C16 10 21 7 27 9 C27 15 22 17 16 15 Z" fill="#22C55E" stroke="#16A34A" stroke-width="1.5"/></svg>`,

  diamond: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><polygon points="10,5 22,5 29,13 16,28 3,13" fill="#38BDF8" stroke="#0284C7" stroke-width="1"/><polygon points="10,5 16,13 22,5" fill="#E0F2FE"/><polygon points="16,13 29,13 16,28" fill="#0284C7"/><polygon points="16,13 3,13 16,28" fill="#0EA5E9"/></svg>`,

  disc: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="13" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/><circle cx="16" cy="16" r="9" stroke="#475569" stroke-width="0.8"/><circle cx="16" cy="16" r="6" stroke="#475569" stroke-width="0.8"/><circle cx="16" cy="16" r="3.5" fill="#F43F5E"/><circle cx="16" cy="16" r="1.5" fill="#FFFFFF"/></svg>`,

  sparkles: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M16 3 C16 9 19 12 25 12 C19 12 16 15 16 21 C16 15 13 12 7 12 C13 12 16 9 16 3 Z" fill="#FACC15"/><path d="M24 18 C24 21 25.5 22.5 28.5 22.5 C25.5 22.5 24 24 24 27 C24 24 22.5 22.5 19.5 22.5 C22.5 22.5 24 21 24 18 Z" fill="#38BDF8"/><path d="M7 20 C7 22 8 23 10 23 C8 23 7 24 7 26 C7 24 6 23 4 23 C6 23 7 22 7 20 Z" fill="#F43F5E"/></svg>`,

  galaxy: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="5" fill="#FACC15"/><ellipse cx="16" cy="16" rx="14" ry="5" transform="rotate(-30 16 16)" stroke="#818CF8" stroke-width="2" fill="none"/><circle cx="7" cy="11" r="1.5" fill="#F43F5E"/><circle cx="25" cy="21" r="1.5" fill="#38BDF8"/></svg>`,

  potion: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><rect x="13" y="3" width="6" height="3" rx="1" fill="#94A3B8"/><path d="M14 6 V12 L6 25 C5 27 6 29 8 29 H24 C26 29 27 27 26 25 L18 12 V6 Z" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/><path d="M8 25 L12 18 H20 L24 25 C25 26.5 24 28 22 28 H10 C8 28 7 26.5 8 25 Z" fill="#A855F7"/><circle cx="14" cy="22" r="1.5" fill="#F3E8FF"/><circle cx="18" cy="24" r="1" fill="#F3E8FF"/></svg>`,

  violin: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><path d="M12 14 C10 13 9 10 11 8 C13 6 16 7 17 9 C18 11 17 13 15 14 C18 16 19 18 18 21 C17 24 13 25 11 23 C9 21 10 17 12 14 Z" fill="#D97706" stroke="#92400E" stroke-width="1"/><rect x="14" y="3" width="2" height="12" fill="#78350F"/><circle cx="15" cy="3" r="1.5" fill="#F59E0B"/><line x1="26" y1="5" x2="6" y2="25" stroke="#FBBF24" stroke-width="1.2"/></svg>`,

  trident: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><line x1="16" y1="5" x2="16" y2="28" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"/><path d="M9 7 V14 C9 18 16 18 16 18 C16 18 23 18 23 14 V7" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" fill="none"/><polygon points="9,3 6,8 12,8" fill="#F59E0B"/><polygon points="16,2 13,6 19,6" fill="#F59E0B"/><polygon points="23,3 20,8 26,8" fill="#F59E0B"/></svg>`,

  award: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="12" r="8" fill="#FACC15" stroke="#EAB308" stroke-width="1.5"/><circle cx="16" cy="12" r="5" stroke="#FEF08A" stroke-width="1" stroke-dasharray="2 2"/><path d="M12 18 L9 29 L16 25 L23 29 L20 18" fill="#EF4444"/><circle cx="16" cy="12" r="2" fill="#CA8A04"/></svg>`,

  clock: (s = 24, c = '', st = '') => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" fill="none" class="${c}" style="${st}"><circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2.5" fill="none"/><line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="16" y1="16" x2="22" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
};

const EMOJI_TO_ICON = {
  '🦊': 'fox',
  '🐯': 'tiger',
  '🚀': 'rocket',
  '🎧': 'headphones',
  '⚡': 'bolt',
  '🍕': 'pizza',
  '👑': 'crown',
  '🦄': 'unicorn',
  '🎸': 'guitar',
  '👾': 'invader',
  '🎵': 'music',
  '🏰': 'disney',
  '💾': '2000s',
  '🎤': 'rap-fr',
  '🎬': 'cinema',
  '📺': 'series',
  '🎮': 'gaming',
  '🪩': '80s',
  '🥖': '80s-fr',
  '📼': '2000s-fr',
  '🔥': 'pop-hits',
  '🔗': 'custom',
  '🏆': 'trophy',
  '🥇': 'medal-gold',
  '🥈': 'medal-silver',
  '🥉': 'medal-bronze',
  '🎯': 'sniper',
  '🐢': 'tortue',
  '🖤': 'chat_noir',
  '🔔': 'bell-on',
  '🔕': 'bell-off',
  '🔊': 'volume-up',
  '🔒': 'lock',
  '✓': 'check',
  '✕': 'cross',
  '📱': 'mobile',
  '🎉': 'party',
  '👋': 'wave',
  '🌱': 'sprout',
  '💿': 'disc',
  '💎': 'diamond',
  '🌟': 'star',
  '✨': 'sparkles',
  '🌌': 'galaxy',
  '💫': 'sparkles',
  '🎼': 'music',
  '🪐': 'galaxy',
  '💠': 'diamond',
  '📻': 'series',
  '⚗️': 'potion',
  '⚗': 'potion',
  '🎻': 'violin',
  '🔱': 'trident',
  '🌠': 'star',
  '🌀': 'galaxy',
  '☄️': 'flame',
  '☄': 'flame',
  '🕹️': 'gaming',
  '🕹': 'gaming',
  '🎖️': 'award',
  '🎖': 'award',
  '➔': 'arrow-right',
  '⏭️': 'skip',
  '⏭': 'skip',
  '⭐': 'star'
};

function renderIcon(nameOrEmoji, options = {}) {
  const size = options.size || 24;
  const className = options.className || '';
  const style = options.style || '';

  if (!nameOrEmoji) {
    return APP_ICONS.star(size, className, style);
  }

  const cleanKey = String(nameOrEmoji).trim();
  if (APP_ICONS[cleanKey]) {
    return APP_ICONS[cleanKey](size, className, style);
  }

  const mappedKey = EMOJI_TO_ICON[cleanKey];
  if (mappedKey && APP_ICONS[mappedKey]) {
    return APP_ICONS[mappedKey](size, className, style);
  }

  for (const [emoji, iconKey] of Object.entries(EMOJI_TO_ICON)) {
    if (cleanKey.includes(emoji)) {
      return APP_ICONS[iconKey](size, className, style);
    }
  }

  return APP_ICONS.music(size, className, style);
}

function renderAvatar(avatarKeyOrEmoji, size = 32, className = '', style = '') {
  if (!avatarKeyOrEmoji) {
    return APP_ICONS.fox(size, className, style);
  }

  const cleanKey = String(avatarKeyOrEmoji).trim();
  if (APP_ICONS[cleanKey]) {
    return APP_ICONS[cleanKey](size, className, style);
  }

  const mappedKey = EMOJI_TO_ICON[cleanKey];
  if (mappedKey && APP_ICONS[mappedKey]) {
    return APP_ICONS[mappedKey](size, className, style);
  }

  return APP_ICONS.fox(size, className, style);
}

function renderThemeIcon(themeIdOrIcon, size = 36, className = '', style = '') {
  if (!themeIdOrIcon) {
    return APP_ICONS.music(size, className, style);
  }

  const cleanKey = String(themeIdOrIcon).trim();
  if (APP_ICONS[cleanKey]) {
    return APP_ICONS[cleanKey](size, className, style);
  }

  const mappedKey = EMOJI_TO_ICON[cleanKey];
  if (mappedKey && APP_ICONS[mappedKey]) {
    return APP_ICONS[mappedKey](size, className, style);
  }

  return APP_ICONS.music(size, className, style);
}

if (typeof window !== 'undefined') {
  window.APP_ICONS = APP_ICONS;
  window.EMOJI_TO_ICON = EMOJI_TO_ICON;
  window.renderIcon = renderIcon;
  window.renderAvatar = renderAvatar;
  window.renderThemeIcon = renderThemeIcon;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_ICONS, EMOJI_TO_ICON, renderIcon, renderAvatar, renderThemeIcon };
}
