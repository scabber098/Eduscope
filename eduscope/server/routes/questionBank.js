const router = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const {
  createQuestion, listQuestions, deleteQuestion, bulkImport, suggestions, markUsed
} = require('../controllers/questionBankController');

const facultyOnly = [authRequired, requireRole('faculty')];

router.get('/suggestions', ...facultyOnly, suggestions);
router.post('/bulk-import', ...facultyOnly, bulkImport);
router.post('/:id/use',    ...facultyOnly, markUsed);
router.get('/',            ...facultyOnly, listQuestions);
router.post('/',           ...facultyOnly, createQuestion);
router.delete('/:id',      ...facultyOnly, deleteQuestion);

module.exports = router;
