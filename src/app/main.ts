require('./style.css');

import { load$ } from './main-app/app-state';
import { setupMockService } from './utils/mock-service';

setupMockService()

load$("test-story", document.getElementById("content") ).subscribe()