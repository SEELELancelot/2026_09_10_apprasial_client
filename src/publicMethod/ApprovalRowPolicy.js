/**
 * ✅ 簽核列表資料權限判斷工具
 *
 * 使用場景：
 * - 獎金調查
 * - 平時考核
 * - 年度考核
 * - 之後其他表單簽核列表也可以共用
 *
 * 核心需求：
 * 1. 送出後資料仍然顯示在列表
 * 2. 但是不在自己手上時，不可編輯、不給刪除、不給勾選合併
 * 3. 簽核中但不是填報者、也不是目前簽核者時，只能查看流程，不可下載 / 預覽
 * 4. 填報者本人在文件簽核中 pending 時，可以抽單
 * 5. 填報者本人送出後，仍可下載 / 預覽自己的文件
 *
 * 注意：
 * - returned 已退回時，文件已經回到填報者手上，不需要也不應該抽單。
 * - withdrawn 已抽單時，不可重複抽單。
 */
class ApprovalRowPolicy {
  static STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    RETURNED: 'returned',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
  };

  /**
   * ✅ 安全轉字串
   */
  static toStringValue(value) {
    return String(value ?? '');
  }

  /**
   * ✅ 是否相同使用者
   */
  static isSameUser(userId1, userId2) {
    return this.toStringValue(userId1) === this.toStringValue(userId2);
  }

  /**
   * ✅ 取得填報者 / 申請者 user_id
   *
   * 後端列表 SQL 建議回傳：
   * A.applicant_user_id
   *
   * 如果沒有 applicant_user_id，
   * 才退回使用 appraisal_excel.create_user。
   */
  static getApplicantUserId(row) {
    return row?.applicant_user_id || row?.create_user || row?.create_userId;
  }

  /**
   * ✅ 是否尚未送出簽核
   *
   * 注意：
   * 如果後端列表查詢已經排除 withdrawn 流程，
   * 抽單後 approval_id 會查不到，就會自然回到未送出。
   *
   * 如果後端抽單後會把 excel_Send 改回 0，
   * 這裡也會視為未送出。
   */
  static isNotSubmitted(row) {
    const approvalStatus = row?.approval_status;

    return (
      !row?.approval_id ||
      !approvalStatus ||
      approvalStatus === this.STATUS.DRAFT ||
      this.toStringValue(row?.excel_Send) === '0'
    );
  }

  /**
   * ✅ 是否簽核中
   */
  static isPending(row) {
    return row?.approval_status === this.STATUS.PENDING;
  }

  /**
   * ✅ 是否已完成
   */
  static isApproved(row) {
    return row?.approval_status === this.STATUS.APPROVED;
  }

  /**
   * ✅ 是否已退回
   */
  static isReturned(row) {
    return row?.approval_status === this.STATUS.RETURNED;
  }

  /**
   * ✅ 是否已駁回
   */
  static isRejected(row) {
    return row?.approval_status === this.STATUS.REJECTED;
  }

  /**
   * ✅ 是否已抽單
   */
  static isWithdrawn(row) {
    return row?.approval_status === this.STATUS.WITHDRAWN;
  }

  /**
   * ✅ 是否填報者本人
   */
  static isApplicant(row, loginUserId) {
    const applicantUserId = this.getApplicantUserId(row);

    return this.isSameUser(applicantUserId, loginUserId);
  }

  /**
   * ✅ 目前登入者是否為當前關卡簽核者
   *
   * 後端列表 SQL 要回傳：
   * S.approver_user_id AS current_approver_user_id
   */
  static isCurrentApprover(row, loginUserId) {
    return (
      this.isPending(row) &&
      this.isSameUser(row?.current_approver_user_id, loginUserId)
    );
  }

  /**
   * ✅ 這筆資料是否目前在登入者手上
   *
   * true：
   * - 未送出
   * - 簽核中，而且目前登入者是當前簽核者
   *
   * false：
   * - 簽核中，但在別人手上
   * - 已完成
   * - 已退回
   * - 已駁回
   * - 已抽單
   */
  static isInMyHand(row, loginUserId) {
    return (
      this.isNotSubmitted(row) ||
      this.isCurrentApprover(row, loginUserId)
    );
  }

  /**
   * ✅ 是否可以編輯資料
   *
   * 目前只有「未送出」可以編輯。
   *
   * 如果你的後端在 returned 後會把 excel_Send 改回 0，
   * 那 returned 文件會自然回到可編輯。
   */
  static canEdit(row) {
    return this.isNotSubmitted(row);
  }

  /**
   * ✅ 是否可以刪除
   *
   * 規則：
   * - 未送出才可以刪除
   * - 一般使用者 admin_type === '0' 只能刪自己的未送出資料
   * - 特定超級管理者 6868 可刪未送出資料
   */
  static canDelete(row, user) {
    const loginUserId = user?.USER_ID;
    const adminType = user?.admin_type;

    if (!this.canEdit(row)) return false;

    const isExcelNotSend = this.toStringValue(row?.excel_Send) === '0';

    if (!isExcelNotSend) return false;

    // 一般使用者：只能刪自己的未送出資料
    if (adminType === '0') {
      return this.isApplicant(row, loginUserId);
    }

    // 超級管理者：6868 可刪未送出資料
    if (adminType === '1' && this.isSameUser(loginUserId, '6868')) {
      return true;
    }

    return false;
  }

  /**
   * ✅ 是否可以勾選合併
   *
   * 送出後不可合併。
   */
  static canSelect(row) {
    return this.canEdit(row);
  }

  /**
   * ✅ 是否可以下載 / 預覽
   *
   * 規則：
   * 1. 未送出：可以下載 / 預覽
   * 2. 填報者本人：送出後仍可下載 / 預覽
   * 3. 目前簽核者：可以下載 / 預覽
   * 4. 已完成：可以下載 / 預覽
   * 5. 簽核中但不是填報者、也不是目前簽核者：不可下載 / 預覽
   * 6. 已抽單：
   *    - 如果後端已把 excel_Send 改回 0，會被 isNotSubmitted 視為可看
   *    - 如果後端仍保留 withdrawn + excel_Send=1，則不可看
   */
  static canViewFile(row, loginUserId) {
    // 未送出，可以看
    // 抽單後如果後端把 excel_Send 改回 0，也會走這裡
    if (this.isNotSubmitted(row)) return true;

    // 已抽單但沒有回到未送出，不給下載 / 預覽
    if (this.isWithdrawn(row)) return false;

    // ✅ 填報者本人送出後，仍可下載 / 預覽
    if (this.isApplicant(row, loginUserId)) return true;

    // 目前輪到自己簽核，可以看
    if (this.isCurrentApprover(row, loginUserId)) return true;

    // 已完成，可以看
    if (this.isApproved(row)) return true;

    return false;
  }

  /**
   * ✅ 是否唯讀
   */
  static isReadonly(row, loginUserId) {
    return !this.isInMyHand(row, loginUserId);
  }

  /**
   * ✅ 是否可以抽單
   *
   * 規則：
   * 1. 必須是填報者本人
   * 2. 必須已經有 approval_id，代表已送出過
   * 3. 必須是 pending 簽核中
   *
   * 可以抽單：
   * - pending：簽核中，文件在別人手上，填報者可以抽回
   *
   * 不可抽單：
   * - draft：尚未送出，沒有流程可抽
   * - returned：已退回，文件已經回到填報者手上，不需要抽單
   * - rejected：已駁回，流程已結束
   * - approved：已完成，不能抽單
   * - withdrawn：已抽單，不能重複抽單
   */
  static canWithdraw(row, loginUserId) {
    const approvalStatus = row?.approval_status;

    if (!this.isApplicant(row, loginUserId)) return false;

    if (!row?.approval_id) return false;

    // ✅ 重點：只有 pending 簽核中才可以抽單
    if (approvalStatus !== this.STATUS.PENDING) return false;

    return true;
  }

  /**
   * ✅ 是否可以重新送出
   *
   * 規則：
   * - 未送出可以送出
   *
   * 注意：
   * 如果退回後要讓填報者重新送出，
   * 建議後端退回時把 appraisal_excel.excel_Send 改回 0，
   * 或讓列表查詢時 returned 文件轉成可重新送出的狀態。
   */
  static canSubmit(row) {
    return this.isNotSubmitted(row);
  }

  /**
   * ✅ 取得流程按鈕模式
   *
   * 回傳：
   * - submit：送出簽核
   * - approve：簽核處理
   * - readonly：查看流程
   * - approved：已完成
   * - returned：已退回
   * - rejected：已駁回
   * - withdrawn：已抽單
   */
  static getActionMode(row, loginUserId) {
    if (this.canSubmit(row)) {
      return 'submit';
    }

    if (this.isCurrentApprover(row, loginUserId)) {
      return 'approve';
    }

    if (this.isApproved(row)) {
      return 'approved';
    }

    if (this.isReturned(row)) {
      return 'returned';
    }

    if (this.isRejected(row)) {
      return 'rejected';
    }

    if (this.isWithdrawn(row)) {
      return 'withdrawn';
    }

    return 'readonly';
  }

  /**
   * ✅ 取得狀態文字
   */
  static getStatusText(row) {
    const approvalStatus = row?.approval_status;

    if (approvalStatus === this.STATUS.PENDING) {
      return row?.current_step_name
        ? `簽核中：${row.current_step_name}`
        : '簽核中';
    }

    if (approvalStatus === this.STATUS.APPROVED) {
      return '已完成';
    }

    if (approvalStatus === this.STATUS.RETURNED) {
      return '已退回';
    }

    if (approvalStatus === this.STATUS.REJECTED) {
      return '已駁回';
    }

    if (approvalStatus === this.STATUS.WITHDRAWN) {
      return '已抽單';
    }

    if (approvalStatus === this.STATUS.DRAFT) {
      return '未送出';
    }

    if (this.toStringValue(row?.excel_Send) === '1') {
      return '已送出';
    }

    return '未送出';
  }

  /**
   * ✅ 取得狀態顏色
   */
  static getStatusColor(row) {
    const approvalStatus = row?.approval_status;

    if (approvalStatus === this.STATUS.PENDING) {
      return '#fa8c16';
    }

    if (approvalStatus === this.STATUS.APPROVED) {
      return '#52c41a';
    }

    if (approvalStatus === this.STATUS.RETURNED) {
      return '#ff4d4f';
    }

    if (approvalStatus === this.STATUS.REJECTED) {
      return '#ff4d4f';
    }

    if (approvalStatus === this.STATUS.WITHDRAWN) {
      return '#722ed1';
    }

    if (approvalStatus === this.STATUS.DRAFT) {
      return '#666';
    }

    if (this.toStringValue(row?.excel_Send) === '1') {
      return '#1677ff';
    }

    return '#666';
  }

  /**
   * ✅ 取得狀態 Badge 樣式
   *
   * 如果之後你不用 inline color，
   * 可以改用這個回傳 className。
   */
  static getStatusClassName(row) {
    const approvalStatus = row?.approval_status;

    if (approvalStatus === this.STATUS.PENDING) {
      return 'text-orange-600 font-semibold';
    }

    if (approvalStatus === this.STATUS.APPROVED) {
      return 'text-green-600 font-semibold';
    }

    if (approvalStatus === this.STATUS.RETURNED) {
      return 'text-red-600 font-semibold';
    }

    if (approvalStatus === this.STATUS.REJECTED) {
      return 'text-red-600 font-semibold';
    }

    if (approvalStatus === this.STATUS.WITHDRAWN) {
      return 'text-purple-600 font-semibold';
    }

    return 'text-gray-600 font-semibold';
  }
}

export default ApprovalRowPolicy;
