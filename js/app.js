"use strict";
// 出席管理アプリのメインJavaScript
class AttendanceManager {
    constructor() {
        this.subjects = [];
        this.targetRate = 60;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.bindEvents();
        this.render();
    }

    // イベントのバインド
    bindEvents() {
        document.getElementById('addSubjectBtn').addEventListener('click', () => this.addSubject());
        document.getElementById('targetRate').addEventListener('change', (e) => this.updateTargetRate(e));
    }

    // 目標出席率の更新
    updateTargetRate(e) {
        this.targetRate = parseInt(e.target.value) || 60;
        this.saveToLocalStorage();
        this.render();
    }

    // 教科の追加
    addSubject() {
        const newSubject = {
            id: Date.now(),
            name: '新規教科',
            totalClasses: '',  // デフォルトで空欄
            attendanceCount: 0,
            absenceCount: 0
        };
        this.subjects.push(newSubject);
        this.saveToLocalStorage();
        this.render();
    }

    // 教科の削除
    deleteSubject(id) {
        this.subjects = this.subjects.filter(subject => subject.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    // 出席数の更新（独立管理、総コマ数が空欄の場合は無制限）
    updateAttendance(id, delta) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            const newCount = subject.attendanceCount + delta;
            
            // 総コマ数が設定されている場合のみ上限チェック
            if (subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0) {
                const maxClasses = parseInt(subject.totalClasses) || 0;
                const currentTotal = subject.attendanceCount + subject.absenceCount;
                
                // 増加操作の場合、出席数+欠席数が総コマ数を超えないように制限
                if (delta > 0 && currentTotal >= maxClasses) {
                    return; // 増加させない
                }
                
                if (newCount > maxClasses) {
                    subject.attendanceCount = maxClasses;
                } else if (newCount < 0) {
                    subject.attendanceCount = 0;
                } else {
                    subject.attendanceCount = newCount;
                }
            } else {
                // 総コマ数が空欄の場合は下限のみチェック
                subject.attendanceCount = Math.max(0, newCount);
            }
            
            this.saveToLocalStorage();
            this.render();
        } else {
            console.error('教科が見つかりません:', id);
        }
    }

    // 欠席数の更新（独立管理、総コマ数が空欄の場合は無制限）
    updateAbsence(id, delta) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            const newCount = subject.absenceCount + delta;
            
            // 総コマ数が設定されている場合のみ上限チェック
            if (subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0) {
                const maxClasses = parseInt(subject.totalClasses) || 0;
                const currentTotal = subject.attendanceCount + subject.absenceCount;
                
                // 増加操作の場合、出席数+欠席数が総コマ数を超えないように制限
                if (delta > 0 && currentTotal >= maxClasses) {
                    return; // 増加させない
                }
                
                if (newCount > maxClasses) {
                    subject.absenceCount = maxClasses;
                } else if (newCount < 0) {
                    subject.absenceCount = 0;
                } else {
                    subject.absenceCount = newCount;
                }
            } else {
                // 総コマ数が空欄の場合は下限のみチェック
                subject.absenceCount = Math.max(0, newCount);
            }
            
            this.saveToLocalStorage();
            this.render();
        } else {
            console.error('教科が見つかりません:', id);
        }
    }

    // 総コマ数の更新（0または空欄入力時は空欄にする）
    updateTotalClasses(id, totalClasses) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            // 0または空欄の場合は空欄にする
            if (totalClasses === '' || totalClasses === '0' || totalClasses === 0 || parseInt(totalClasses) <= 0) {
                subject.totalClasses = '';
            } else {
                subject.totalClasses = Math.max(1, parseInt(totalClasses) || 1);
            }
            
            // 出席数・欠席数が総コマ数を超えないように調整（総コマ数が設定されている場合のみ）
            if (subject.totalClasses !== '') {
                const maxClasses = parseInt(subject.totalClasses) || 0;
                subject.attendanceCount = Math.min(subject.attendanceCount, maxClasses);
                subject.absenceCount = Math.min(subject.absenceCount, maxClasses);
                
                // 出席数+欠席数が総コマ数を超えないように調整
                const totalUsed = subject.attendanceCount + subject.absenceCount;
                if (totalUsed > maxClasses) {
                    // 比率を維持しながら調整
                    const ratio = subject.attendanceCount / totalUsed;
                    subject.attendanceCount = Math.round(maxClasses * ratio);
                    subject.absenceCount = maxClasses - subject.attendanceCount;
                }
            }
            
            this.saveToLocalStorage();
            this.render();
        }
    }

    // 教科名の更新
    updateSubjectName(id, name) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            subject.name = name || '無題の教科';
            this.saveToLocalStorage();
        }
    }

    // 教科名編集モードに入る
    editSubjectName(id) {
        const displayElement = document.getElementById(`name-display-${id}`);
        const inputElement = document.getElementById(`name-input-${id}`);
        
        if (displayElement && inputElement) {
            displayElement.style.display = 'none';
            inputElement.style.display = 'inline-block';
            inputElement.focus();
            inputElement.select();
        }
    }

    // 教科名を保存して表示モードに戻る
    saveSubjectName(id) {
        const displayElement = document.getElementById(`name-display-${id}`);
        const inputElement = document.getElementById(`name-input-${id}`);
        
        if (displayElement && inputElement) {
            const newName = inputElement.value.trim() || '無題の教科';
            this.updateSubjectName(id, newName);
            displayElement.textContent = newName;
            displayElement.style.display = 'inline-block';
            inputElement.style.display = 'none';
        }
    }

    // 教科名編集時のキーボード処理
    handleNameKeydown(event, id) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.saveSubjectName(id);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            const displayElement = document.getElementById(`name-display-${id}`);
            const inputElement = document.getElementById(`name-input-${id}`);
            if (displayElement && inputElement) {
                inputElement.value = displayElement.textContent;
                displayElement.style.display = 'inline-block';
                inputElement.style.display = 'none';
            }
        }
    }

    // 出席率を計算（出席数÷(出席数＋欠席数)）
    calculateAttendanceRate(attendanceCount, absenceCount) {
        const total = attendanceCount + absenceCount;
        if (total === 0) return 0;
        return Math.round((attendanceCount / total) * 100);
    }

    // 残りコマ数を計算（総コマ数が空欄の場合は0として計算）
    calculateRemainingClasses(totalClasses, attendanceCount, absenceCount) {
        if (totalClasses === '' || totalClasses === null || totalClasses === undefined) {
            return 0;
        }
        const total = attendanceCount + absenceCount;
        const maxClasses = parseInt(totalClasses) || 0;
        return Math.max(0, maxClasses - total);
    }

    // 残り許容欠席数を計算（残りコマ数の制限を外す）
    calculateAllowedAbsences(totalClasses, attendanceCount, currentAbsences) {
        if (totalClasses === '' || totalClasses === null || totalClasses === undefined) {
            return null;  // 空欄の場合はnullを返す
        }
        
        const targetAttendance = this.targetRate / 100;
        const maxClasses = parseInt(totalClasses) || 0;
        const requiredAttendance = Math.ceil(maxClasses * targetAttendance);
        const currentAttendance = attendanceCount;
        
        // 目標達成に必要な出席数
        const neededAttendance = Math.max(0, requiredAttendance);
        
        // 理論上、欠席できる最大数（残りコマ数の制限を外す）
        // これは「目標を達成できない」状況も含む
        const theoreticalMaxAbsences = maxClasses - neededAttendance - currentAbsences;
        console.log(theoreticalMaxAbsences);
        
        // デバッグ用
        console.log('calculateAllowedAbsences:', {
            totalClasses,
            attendanceCount,
            currentAbsences,
            targetRate: this.targetRate,
            maxClasses,
            requiredAttendance,
            currentAttendance,
            neededAttendance,
            theoreticalMaxAbsences,
            result: Math.max(-999, theoreticalMaxAbsences)
        });
        
        // 負の数にならないようにするというのは嘘
        return theoreticalMaxAbsences; //Math.max(-999, )
    }

    // キーボード入力処理（シンプルな実装）
    handleKeyboardInput(event, id, type) {
        const step = event.shiftKey ? 5 : 1; // Shiftキーで5ずつ増減
        
        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                if (type === 'attendance') {
                    this.updateAttendance(id, step);
                } else {
                    this.updateAbsence(id, step);
                }
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (type === 'attendance') {
                    this.updateAttendance(id, -step);
                } else {
                    this.updateAbsence(id, -step);
                }
                break;
            // 上矢印・下矢印以外はすべてデフォルト動作を許可
            // number型のinput要素はブラウザが自動的に適切な入力を制御する
            default:
                // デフォルト動作を許可（バックスペース、Delete、数字入力など）
                break;
        }
    }

    // 出席数を直接設定（最大値制限付き、総コマ数が空欄の場合は無制限）
    setAttendance(id, value) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            let newValue = parseInt(value) || 0;
            
            // 総コマ数が設定されている場合は最大値を制限
            if (subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0) {
                const maxClasses = parseInt(subject.totalClasses) || 0;
                // 出席数+欠席数が総コマ数を超えないように制限
                const maxAttendance = Math.max(0, maxClasses - subject.absenceCount);
                newValue = Math.min(Math.max(0, newValue), maxAttendance);
            } else {
                // 総コマ数が空欄の場合は負の数を防ぐのみ
                newValue = Math.max(0, newValue);
            }
            
            subject.attendanceCount = newValue;
            this.saveToLocalStorage();
            this.render();
        }
    }

    // 欠席数を直接設定（最大値制限付き、総コマ数が空欄の場合は無制限）
    setAbsence(id, value) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            let newValue = parseInt(value) || 0;
            
            // 総コマ数が設定されている場合は最大値を制限
            if (subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0) {
                const maxClasses = parseInt(subject.totalClasses) || 0;
                // 出席数+欠席数が総コマ数を超えないように制限
                const maxAbsence = Math.max(0, maxClasses - subject.attendanceCount);
                newValue = Math.min(Math.max(0, newValue), maxAbsence);
            } else {
                // 総コマ数が空欄の場合は負の数を防ぐのみ
                newValue = Math.max(0, newValue);
            }
            
            subject.absenceCount = newValue;
            this.saveToLocalStorage();
            this.render();
        }
    }

    // 出席率の色を決定
    getAttendanceRateColor(rate) {
        if (rate >= this.targetRate) return 'attendance-rate';
        if (rate >= this.targetRate - 10) return 'attendance-rate warning';
        return 'attendance-rate danger';
    }

    // 教科カードのHTMLを生成
    generateSubjectCard(subject) {
        const attendanceRate = this.calculateAttendanceRate(subject.attendanceCount, subject.absenceCount);
        let remainingClasses = this.calculateRemainingClasses(subject.totalClasses, subject.attendanceCount, subject.absenceCount);
        let allowedAbsences = this.calculateAllowedAbsences(subject.totalClasses, subject.attendanceCount, subject.absenceCount);

        if(allowedAbsences === null){
            allowedAbsences = "-";
        }

        // デバッグ用の簡易テスト
        if (subject.name === '新規教科') {
            console.log('テスト - 残り許容欠席数:', allowedAbsences);
            console.log('条件:', subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0);
            console.log('総コマ数:', subject.totalClasses);
        }
        
        // デバッグ用
        console.log('Card generation:', {
            subjectName: subject.name,
            totalClasses: subject.totalClasses,
            attendanceCount: subject.attendanceCount,
            absenceCount: subject.absenceCount,
            attendanceRate: attendanceRate,
            remainingClasses: remainingClasses,
            allowedAbsences: allowedAbsences
        });
        
        // 目標達成可否を判定
        let targetStatus = '-';
        let targetStatusClass = 'stat-value';
        if (subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0) {
            const targetAttendance = this.targetRate / 100;
            const maxClasses = parseInt(subject.totalClasses) || 0;
            const requiredAttendance = Math.ceil(maxClasses * targetAttendance);
            const currentAttendance = subject.attendanceCount;
            
            if (!subject.totalClasses){
            } else if (currentAttendance >= requiredAttendance) {
                targetStatus = '目標達成';
                targetStatusClass = 'target-achieved';
            } else if (allowedAbsences != null && allowedAbsences < 0) {
                targetStatus = '目標達成不可';
                targetStatusClass = 'target-failed';
            } else {
                targetStatus = '目標未達成';
                targetStatusClass = 'target-not-achieved';
            }
        } else {
            remainingClasses = "-";
        }

        let rateColor = this.getAttendanceRateColor(attendanceRate);
        return `
            <div class="subject-card" data-id="${subject.id}">
                <div class="subject-header">
                    <div class="subject-name-container">
                        <span class="subject-name-display" onclick="attendanceManager.editSubjectName(${subject.id})" id="name-display-${subject.id}">${subject.name}</span>
                        <input type="text" class="subject-name-input" value="${subject.name}" 
                               onblur="attendanceManager.saveSubjectName(${subject.id})"
                               onkeydown="attendanceManager.handleNameKeydown(event, ${subject.id})"
                               id="name-input-${subject.id}" style="display: none;">
                    </div>
                    <button class="delete-btn" onclick="attendanceManager.deleteSubject(${subject.id})">削除</button>
                </div>

                <div class="total-classes-section">
                    <label class="total-classes-label">総コマ数</label>
                    <input type="number" class="total-classes-input" value="${subject.totalClasses}" 
                           onchange="attendanceManager.updateTotalClasses(${subject.id}, this.value)">
                </div>

                <div class="count-section">
                    <label class="count-label">出席数</label>
                    <div class="count-controls">
                        <button class="count-btn minus-btn" 
                                onclick="attendanceManager.updateAttendance(${subject.id}, -1)"
                                ${subject.attendanceCount <= 0 ? 'disabled' : ''}>－</button>
                        <input type="number" class="count-display-input" value="${subject.attendanceCount}" 
                               onchange="attendanceManager.setAttendance(${subject.id}, this.value)"
                               onkeydown="attendanceManager.handleKeyboardInput(event, ${subject.id}, 'attendance')"
                               min="0" max="${subject.totalClasses === '' ? '999' : subject.totalClasses}">
                        <button class="count-btn plus-btn" 
                                onclick="attendanceManager.updateAttendance(${subject.id}, 1)"
                                ${(subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0 && subject.attendanceCount + subject.absenceCount >= (parseInt(subject.totalClasses) || 0)) ? 'disabled' : ''}>＋</button>
                    </div>
                </div>

                <div class="count-section">
                    <label class="count-label">欠席数</label>
                    <div class="count-controls">
                        <button class="count-btn minus-btn" 
                                onclick="attendanceManager.updateAbsence(${subject.id}, -1)"
                                ${subject.absenceCount <= 0 ? 'disabled' : ''}>－</button>
                        <input type="number" class="count-display-input" value="${subject.absenceCount}" 
                               onchange="attendanceManager.setAbsence(${subject.id}, this.value)"
                               onkeydown="attendanceManager.handleKeyboardInput(event, ${subject.id}, 'absence')"
                               min="0" max="${subject.totalClasses === '' ? '999' : subject.totalClasses}">
                        <button class="count-btn plus-btn" 
                                onclick="attendanceManager.updateAbsence(${subject.id}, 1)"
                                ${(subject.totalClasses !== '' && subject.totalClasses !== '0' && subject.totalClasses !== 0 && subject.attendanceCount + subject.absenceCount >= (parseInt(subject.totalClasses) || 0)) ? 'disabled' : ''}>＋</button>
                    </div>
                </div>

                <div class="stats-section">
                    <h3 class="stats-title">統計情報</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">出席率</span>
                            <span class="stat-value ${rateColor}">${attendanceRate}%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">残りコマ数</span>
                            <span class="stat-value">${remainingClasses}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">残り許容欠席数</span>
                            <span class="stat-value">${allowedAbsences}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">目標状態</span>
                            <span class="stat-value ${targetStatusClass}">${targetStatus}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // レンダリング
    render() {
        const container = document.getElementById('subjectsContainer');
        container.innerHTML = this.subjects.map(subject => this.generateSubjectCard(subject)).join('');
    }

    // LocalStorageに保存
    saveToLocalStorage() {
        const data = {
            subjects: this.subjects,
            targetRate: this.targetRate
        };
        localStorage.setItem('attendanceAppData', JSON.stringify(data));
    }

    // LocalStorageから読み込み
    loadFromLocalStorage() {
        const savedData = localStorage.getItem('attendanceAppData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.subjects = data.subjects || [];
                this.targetRate = data.targetRate || 60;
                
                // 目標出席率の入力フィールドを更新
                document.getElementById('targetRate').value = this.targetRate;
            } catch (error) {
                console.error('データの読み込みに失敗しました:', error);
                this.subjects = [];
                this.targetRate = 60;
            }
        }
    }

    // データのクリア（デバッグ用）
    clearAllData() {
        if (confirm('すべてのデータを削除してもよろしいですか？')) {
            this.subjects = [];
            this.targetRate = 60;
            this.saveToLocalStorage();
            document.getElementById('targetRate').value = this.targetRate;
            this.render();
        }
    }
}

// グローバル変数としてインスタンスを作成
let attendanceManager;

// DOMの読み込みが完了してから初期化
document.addEventListener('DOMContentLoaded', function() {
    attendanceManager = new AttendanceManager();
});