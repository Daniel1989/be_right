import { v4 as uuidv4 } from 'uuid';

// Define static subjects for Chinese education system
export const staticSubjects = [
    // 小学科目 (Primary School)
    { id: uuidv4(), name: '小学数学', color: '#FF5252', icon: 'calculator' },
    { id: uuidv4(), name: '小学语文', color: '#7C4DFF', icon: 'book' },
    { id: uuidv4(), name: '小学英语', color: '#448AFF', icon: 'language' },
    { id: uuidv4(), name: '小学科学', color: '#64DD17', icon: 'flask' },
    { id: uuidv4(), name: '小学品德与生活', color: '#FF9800', icon: 'heart' },
    
    // 初中科目 (Middle School)
    { id: uuidv4(), name: '初中数学', color: '#F44336', icon: 'function' },
    { id: uuidv4(), name: '初中语文', color: '#673AB7', icon: 'pencil' },
    { id: uuidv4(), name: '初中英语', color: '#2196F3', icon: 'globe' },
    { id: uuidv4(), name: '初中物理', color: '#00BCD4', icon: 'atom' },
    { id: uuidv4(), name: '初中化学', color: '#4CAF50', icon: 'vial' },
    { id: uuidv4(), name: '初中生物', color: '#8BC34A', icon: 'leaf' },
    { id: uuidv4(), name: '初中历史', color: '#795548', icon: 'landmark' },
    { id: uuidv4(), name: '初中地理', color: '#009688', icon: 'map' },
    { id: uuidv4(), name: '初中政治', color: '#FF5722', icon: 'balance-scale' },
    
    // 高中科目 (High School)
    { id: uuidv4(), name: '高中数学', color: '#E91E63', icon: 'square-root-alt' },
    { id: uuidv4(), name: '高中语文', color: '#9C27B0', icon: 'feather' },
    { id: uuidv4(), name: '高中英语', color: '#03A9F4', icon: 'comment' },
    { id: uuidv4(), name: '高中物理', color: '#00BCD4', icon: 'bolt' },
    { id: uuidv4(), name: '高中化学', color: '#4CAF50', icon: 'flask-potion' },
    { id: uuidv4(), name: '高中生物', color: '#8BC34A', icon: 'dna' },
    { id: uuidv4(), name: '高中历史', color: '#795548', icon: 'book-open' },
    { id: uuidv4(), name: '高中地理', color: '#009688', icon: 'mountain' },
    { id: uuidv4(), name: '高中政治', color: '#FF5722', icon: 'gavel' },
    { id: uuidv4(), name: '高中信息技术', color: '#607D8B', icon: 'laptop-code' },
  ];

  export const DEFALULT_DAILY_GOAL = 10;