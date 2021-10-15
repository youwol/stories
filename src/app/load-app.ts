import { storiesUnitTests } from '../tests/mock-data/database';
import { load$ } from './main-app/app-state';
import { setupMockService } from './utils/mock-service';

setupMockService(
    localStorage.getItem("stories-storage")
            ? JSON.parse(localStorage.getItem("stories-storage"))
            : storiesUnitTests
)

load$("test-story", document.getElementById("content") ).subscribe()